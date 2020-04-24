import firebase from "firebase/app";
import "firebase/firestore";
import firebaseConfig from "./firebaseConfig";
import error404template from "./templates/error404";
type Redirect =
	| {
	version: 1;
	to: string;
	clickAnalytics?: boolean;
	disablePreview?: boolean;
};

firebase.initializeApp(firebaseConfig);

(async () => {
	const segments = window.location.pathname.substring(1).split("/");
	const id = encodeURIComponent(segments[0]); // prevents firebase errors, although valid short urls dont have any characters that would be encoded.
	const data: Redirect | undefined = (await firebase
		.firestore()
		.collection("linkshortener")
		.doc(id)
		.get()).data() as (Redirect | undefined);

	console.log(data);
	if (!data || !data.to) {
		// does not exist
		document.write(error404template);
		document.close();
		return;
	}
	if (segments[1] == "analytics") {
		window.location.replace(`https://beta.t485.org/resources/linkshortener/analytics?id=${segments[0]}`);
		return;
	} else if (segments[1] == "preview") {
		if (data.disablePreview) {
			document.write(`<p>Previews have been disabled for this link by its creator. To follow the link, <a href="/${segments[0]}">click here</a>.`);
			document.close();
			return;
		}
		document.write(`
		<p>This link is sending you to <a href="${data.to}">${data.to}</a>. You will NOT be automatically redirected.</p>
		`)
		document.close();
		return;


	}
	if (data.clickAnalytics) {
		await firebase
			.firestore()
			.collection("linkshortener")
			.doc(id)
			.update({
				clicks: firebase.firestore.FieldValue.arrayUnion(new Date().getTime()),
			});
	}
	window.location.replace(data.to);
	setTimeout(() => {
		document.write(`
		<p>If you are not automatically redirected, please click on the following link: <a href="${data.to}">${data.to}</a>.</p>
		`)
		document.close();
	}, 1000)

})();
