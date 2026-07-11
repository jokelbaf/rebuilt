import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
	layout("components/layout/app-layout.tsx", [
		index("routes/home.tsx"),

		route("resume", "routes/resume.tsx"),
		route("cover-letter", "routes/cover-letter.tsx"),

		route("chat/:id?", "routes/chat/index.tsx"),

		route("discovery", "routes/discovery/index.tsx"),
		route("discovery/vacancies/:id", "routes/discovery/vacancy.tsx"),
		route("discovery/activity", "routes/discovery/activity.tsx"),
		route("discovery/settings", "routes/discovery/settings.tsx"),

		route("resumes", "routes/resumes/index.tsx"),
		route("cover-letters", "routes/cover-letters/index.tsx"),

		route("profile", "routes/profile/index.tsx"),
		route("profile/new", "routes/profile/new.tsx"),
		route("profile/:name/edit", "routes/profile/edit.tsx"),

		route("experience", "routes/experience/index.tsx"),
		route("experience/new", "routes/experience/new.tsx"),
		route("experience/:name/edit", "routes/experience/edit.tsx"),

		route("projects", "routes/projects/index.tsx"),
		route("projects/new", "routes/projects/new.tsx"),
		route("projects/:id/edit", "routes/projects/edit.tsx"),

		route("templates", "routes/templates/index.tsx"),
		route("templates/new", "routes/templates/new.tsx"),
		route("templates/:name/edit", "routes/templates/edit.tsx"),

		route("vacancies", "routes/vacancies/index.tsx"),
		route("vacancies/new", "routes/vacancies/new.tsx"),
		route("vacancies/:id/edit", "routes/vacancies/edit.tsx"),
	]),
] satisfies RouteConfig;
