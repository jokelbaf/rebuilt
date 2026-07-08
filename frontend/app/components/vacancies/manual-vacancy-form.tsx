import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { useCreateVacancy } from "~/lib/api/vacancies";

interface FormValues {
	title: string;
	description: string;
}

export function ManualVacancyForm() {
	const navigate = useNavigate();
	const createVacancy = useCreateVacancy();

	const form = useForm<FormValues>({
		defaultValues: { title: "", description: "" },
	});

	function onSubmit(values: FormValues) {
		createVacancy.mutate(values, {
			onSuccess: (vacancy) => {
				toast.success("Vacancy added");
				navigate(`/vacancies/${vacancy.id}/edit`);
			},
		});
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
				<FormField
					control={form.control}
					name="title"
					rules={{ required: "Title is required" }}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormControl>
								<Input placeholder="Senior Frontend Engineer" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="description"
					rules={{ required: "Description is required" }}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea
									rows={12}
									placeholder="Paste the full job description here..."
									className="resize-none"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={createVacancy.isPending}>
					{createVacancy.isPending ? "Saving..." : "Add Vacancy"}
				</Button>
			</form>
		</Form>
	);
}
