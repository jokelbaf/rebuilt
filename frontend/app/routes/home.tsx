import { redirect } from "react-router";

export function clientLoader() {
	return redirect("/resume");
}

export default function Home() {
	return null;
}
