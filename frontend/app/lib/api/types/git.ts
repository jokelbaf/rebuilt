export interface GitSource {
	id: string;
	username: string;
	createdAt: string;
}

export interface CreateGitSourceInput {
	username: string;
	password: string;
}

export interface GitOwner {
	login: string;
	type: "user" | "organization";
}

export interface GitRepo {
	id: number;
	name: string;
	fullName: string;
	description: string | null;
	private: boolean;
}
