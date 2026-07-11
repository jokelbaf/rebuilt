import { CheckCircle2, CircleHelp, ShieldAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ConfirmDelete } from "~/components/common/confirm-delete";
import { ErrorState, RowSkeletonList } from "~/components/common/states";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
import {
	useDeletePlatformAccount,
	usePlatformAccounts,
	useUpsertPlatformAccount,
	useVerifyPlatformAccount,
} from "~/lib/api/discovery";
import type { DiscoveryPlatform, PlatformAccount } from "~/lib/api/types/discovery";
import { useDelayedFlag } from "~/hooks/use-delayed-flag";
import { formatDateTime } from "~/lib/format";

import { DISCOVERY_PLATFORMS } from "./settings-options";

interface AccountFormValues {
	email: string;
	password: string;
}

export function AccountsSection() {
	const accountsQuery = usePlatformAccounts();
	const accounts = accountsQuery.data ?? [];
	const showSkeleton = useDelayedFlag(accountsQuery.isLoading);

	return (
		<section className="space-y-3">
			<div>
				<h2 className="font-heading text-lg font-medium">Job-board accounts</h2>
				<p className="text-sm text-muted-foreground">
					Both platforms require a verified account before discovery can search them.
				</p>
			</div>
			{showSkeleton && <RowSkeletonList count={2} />}
			{accountsQuery.isError && (
				<ErrorState
					error={accountsQuery.error}
					onRetry={() => accountsQuery.refetch()}
					title="Couldn't load platform accounts"
				/>
			)}
			{!accountsQuery.isError && (
				<div className="grid gap-3 lg:grid-cols-2">
					{DISCOVERY_PLATFORMS.map((platform) => (
						<PlatformAccountCard
							key={`${platform.value}-${accounts.find((account) => account.platform === platform.value)?.id ?? "new"}`}
							platform={platform.value}
							label={platform.label}
							account={accounts.find(
								(account) => account.platform === platform.value
							)}
						/>
					))}
				</div>
			)}
		</section>
	);
}

function PlatformAccountCard({
	platform,
	label,
	account,
}: {
	platform: DiscoveryPlatform;
	label: string;
	account?: PlatformAccount;
}) {
	const upsert = useUpsertPlatformAccount();
	const verify = useVerifyPlatformAccount();
	const remove = useDeletePlatformAccount();
	const form = useForm<AccountFormValues>({
		defaultValues: { email: account?.email ?? "", password: "" },
	});
	const StatusIcon =
		account?.status === "ok"
			? CheckCircle2
			: account?.status === "failed"
				? ShieldAlert
				: CircleHelp;

	function save(values: AccountFormValues) {
		upsert.mutate(
			{ platform, ...values },
			{
				onSuccess: () => {
					toast.success(`${label} credentials saved`);
					form.reset({ email: values.email, password: "" });
				},
			}
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{label}</CardTitle>
				<CardAction className="flex items-center gap-2">
					<Badge
						variant={
							account?.status === "failed"
								? "destructive"
								: account?.status === "ok"
									? "secondary"
									: "outline"
						}
						className="capitalize"
					>
						<StatusIcon />
						{account?.status ?? "not connected"}
					</Badge>
					{account && (
						<ConfirmDelete
							onConfirm={() =>
								remove.mutate(platform, {
									onSuccess: () => toast.success(`${label} account removed`),
								})
							}
							title={`Remove ${label} account?`}
							description="Discovery will skip this platform until credentials are added and verified again."
						/>
					)}
				</CardAction>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(save)} className="space-y-4">
						<FormField
							control={form.control}
							name="email"
							rules={{
								required: "Email is required",
								pattern: {
									value: /^\S+@\S+\.\S+$/,
									message: "Enter a valid email",
								},
							}}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											autoComplete="username"
											placeholder="you@example.com"
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
							rules={{ required: "Password is required to save credentials" }}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											autoComplete="current-password"
											placeholder={
												account?.hasPassword
													? "Stored securely - enter to replace"
													: "Account password"
											}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Write-only. ReBuilt never returns stored passwords to the
										interface.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						{account?.lastVerifiedAt && (
							<p className="text-xs text-muted-foreground">
								Last verified {formatDateTime(account.lastVerifiedAt)}
							</p>
						)}
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								disabled={!account || verify.isPending}
								onClick={() =>
									verify.mutate(platform, {
										onSuccess: () => toast.success(`${label} account verified`),
									})
								}
							>
								{verify.isPending ? "Verifying..." : "Verify"}
							</Button>
							<Button type="submit" disabled={upsert.isPending}>
								{upsert.isPending ? "Saving..." : "Save credentials"}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
