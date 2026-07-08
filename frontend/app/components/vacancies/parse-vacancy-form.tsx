import { Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
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
import { useParseVacancy } from "~/lib/api/vacancies";

interface FormValues {
	url: string;
}

function validateUrl(value: string): string | true {
	try {
		new URL(value);
		return true;
	} catch {
		return "Enter a valid URL";
	}
}

export function ParseVacancyForm() {
	const navigate = useNavigate();
	const parseVacancy = useParseVacancy();

	const form = useForm<FormValues>({
		defaultValues: { url: "" },
	});

	function onSubmit(values: FormValues) {
		parseVacancy.mutate(values, {
			onSuccess: (vacancy) => {
				toast.success("Vacancy parsed");
				navigate(`/vacancies/${vacancy.id}/edit`);
			},
		});
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
				<FormField
					control={form.control}
					name="url"
					rules={{ required: "Enter a URL", validate: validateUrl }}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Job posting URL</FormLabel>
							<FormControl>
								<Input placeholder="https://company.com/careers/role" {...field} />
							</FormControl>
							<FormDescription>
								We'll fetch the posting and extract the title, description and
								language.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={parseVacancy.isPending}>
					<Sparkles className="size-4" />
					{parseVacancy.isPending ? "Parsing..." : "Parse Vacancy"}
				</Button>
			</form>
		</Form>
	);
}
