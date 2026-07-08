import { Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { GitImportProgress } from "~/components/projects/git-import-progress";
import { GitOwnerSelect } from "~/components/projects/git-owner-select";
import { GitRepoList } from "~/components/projects/git-repo-list";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { useImportProjectFromGit } from "~/lib/api/projects";

export function GitImport() {
	const navigate = useNavigate();
	const [owner, setOwner] = useState<string>();
	const [repo, setRepo] = useState<string>();
	const importProject = useImportProjectFromGit();

	function handleConfirm() {
		if (!owner || !repo) return;
		importProject.mutate(
			{ owner, repo },
			{
				onSuccess: (project) => {
					toast.success("Project imported");
					navigate(`/projects/${project.id}/edit`);
				},
			}
		);
	}

	if (importProject.isPending) {
		return <GitImportProgress repo={repo ?? ""} />;
	}

	return (
		<div className="space-y-5">
			<div className="space-y-2">
				<Label>Owner</Label>
				<GitOwnerSelect
					value={owner}
					onChange={(value) => {
						setOwner(value);
						setRepo(undefined);
					}}
				/>
			</div>

			{owner && <GitRepoList owner={owner} selected={repo} onSelect={setRepo} />}

			<div className="flex justify-end border-t pt-4">
				<Button onClick={handleConfirm} disabled={!repo}>
					<Sparkles className="size-4" />
					Confirm & Import
				</Button>
			</div>
		</div>
	);
}
