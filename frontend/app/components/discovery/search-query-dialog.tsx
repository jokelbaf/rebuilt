import { Controller, useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import type { DiscoveryPlatform, SearchQuery, SearchQueryInput } from "~/lib/api/types/discovery";

import {
	DISCOVERY_PLATFORMS,
	ENGLISH_LEVELS,
	SENIORITY_LEVELS,
	SUPPORTED_CURRENCIES,
} from "./settings-options";

const NONE = "none";

interface SearchQueryDialogProps {
	open: boolean;
	query?: SearchQuery;
	isSubmitting: boolean;
	onClose: () => void;
	onSubmit: (input: SearchQueryInput) => void;
}

function defaults(query?: SearchQuery): SearchQueryInput {
	return (
		query ?? {
			name: "",
			enabled: true,
			platforms: ["robota", "djinni"],
			wishes: "",
			salaryMin: null,
			salaryCurrency: "USD",
			seniority: "",
			remoteOnly: false,
			location: "",
			englishLevel: "",
		}
	);
}

export function SearchQueryDialog({
	open,
	query,
	isSubmitting,
	onClose,
	onSubmit,
}: SearchQueryDialogProps) {
	const form = useForm<SearchQueryInput>({ defaultValues: defaults(query) });

	return (
		<Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{query ? "Edit search query" : "Create search query"}</DialogTitle>
					<DialogDescription>
						Define what each job board should search for and how the AI should judge the
						results.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
						<div className="grid gap-4 sm:grid-cols-[1fr_auto]">
							<FormField
								control={form.control}
								name="name"
								rules={{ required: "Position is required" }}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Position</FormLabel>
										<FormControl>
											<Input placeholder="Backend Developer" {...field} />
										</FormControl>
										<FormDescription>
											Searched on each job board, exactly as a candidate would
											type it.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="enabled"
								render={({ field }) => (
									<FormItem className="min-w-28">
										<FormLabel>Enabled</FormLabel>
										<div className="flex h-8 items-center">
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</div>
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="wishes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>What are you looking for?</FormLabel>
									<FormControl>
										<Textarea
											rows={4}
											placeholder="Product-focused role, small team, meaningful ownership..."
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Used by the AI to rate vacancies.
									</FormDescription>
								</FormItem>
							)}
						/>

						<Controller
							control={form.control}
							name="platforms"
							rules={{
								validate: (value) =>
									value.length > 0 || "Select at least one platform",
							}}
							render={({ field, fieldState }) => (
								<div className="grid gap-2">
									<Label>Platforms</Label>
									<div className="grid gap-2 sm:grid-cols-2">
										{DISCOVERY_PLATFORMS.map((platform) => (
											<label
												key={platform.value}
												className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
											>
												<input
													type="checkbox"
													className="mt-0.5 size-4 accent-primary"
													checked={field.value.includes(platform.value)}
													onChange={(event) =>
														field.onChange(
															togglePlatform(
																field.value,
																platform.value,
																event.target.checked
															)
														)
													}
												/>
												<span>
													<span className="block font-medium">
														{platform.label}
													</span>
													<span className="text-xs text-muted-foreground">
														{platform.description}
													</span>
												</span>
											</label>
										))}
									</div>
									{fieldState.error && (
										<p className="text-sm text-destructive">
											{fieldState.error.message}
										</p>
									)}
								</div>
							)}
						/>

						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="salaryMin"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Minimum salary</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												placeholder="3000"
												value={field.value ?? ""}
												onChange={(event) =>
													field.onChange(
														event.target.value
															? Number(event.target.value)
															: null
													)
												}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="salaryCurrency"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Salary currency</FormLabel>
										<Select
											value={field.value ?? "USD"}
											onValueChange={field.onChange}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{SUPPORTED_CURRENCIES.map((value) => (
													<SelectItem key={value} value={value}>
														{value}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="seniority"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Seniority</FormLabel>
										<Select
											value={field.value || NONE}
											onValueChange={(value) =>
												field.onChange(value === NONE ? "" : value)
											}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value={NONE}>Any seniority</SelectItem>
												{SENIORITY_LEVELS.map((value) => (
													<SelectItem
														key={value}
														value={value}
														className="capitalize"
													>
														{value}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="englishLevel"
								render={({ field }) => (
									<FormItem>
										<FormLabel>English level</FormLabel>
										<Select
											value={field.value || NONE}
											onValueChange={(value) =>
												field.onChange(value === NONE ? "" : value)
											}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value={NONE}>Any level</SelectItem>
												{ENGLISH_LEVELS.map((value) => (
													<SelectItem
														key={value}
														value={value}
														className="capitalize"
													>
														{value}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-[1fr_auto]">
							<FormField
								control={form.control}
								name="location"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Location</FormLabel>
										<FormControl>
											<Input placeholder="Kyiv, Ukraine" {...field} />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="remoteOnly"
								render={({ field }) => (
									<FormItem className="min-w-28">
										<FormLabel>Remote only</FormLabel>
										<div className="flex h-8 items-center">
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</div>
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={onClose}>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting
									? "Saving..."
									: query
										? "Save changes"
										: "Create query"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

function togglePlatform(
	values: DiscoveryPlatform[],
	platform: DiscoveryPlatform,
	checked: boolean
) {
	return checked
		? [...new Set([...values, platform])]
		: values.filter((value) => value !== platform);
}
