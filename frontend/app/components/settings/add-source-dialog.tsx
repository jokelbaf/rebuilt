import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useCreateGitSource } from "~/lib/api/git";

interface FormValues {
	username: string;
	password: string;
}

export function AddSourceDialog() {
	const [open, setOpen] = useState(false);
	const createSource = useCreateGitSource();

	const form = useForm<FormValues>({
		defaultValues: { username: "", password: "" },
	});

	function onSubmit(values: FormValues) {
		createSource.mutate(values, {
			onSuccess: () => {
				toast.success("Git source added");
				setOpen(false);
				form.reset();
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">
					<Plus className="size-4" />
					Add Source
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Git source</DialogTitle>
					<DialogDescription>
						Provide credentials used to clone private repositories when importing
						projects.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="username"
							rules={{ required: "Username is required" }}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Username</FormLabel>
									<FormControl>
										<Input
											placeholder="github-username"
											autoComplete="off"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							rules={{ required: "Access token is required" }}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Access token</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="ghp_..."
											autoComplete="off"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										A personal access token with repository read access.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button type="submit" disabled={createSource.isPending}>
								{createSource.isPending ? "Adding..." : "Add Source"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
