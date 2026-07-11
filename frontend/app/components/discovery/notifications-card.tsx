import { Bell, Send } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { useTestTelegramNotification, useUpdateDiscoverySettings } from "~/lib/api/discovery";
import type { DiscoveryNotificationSettings, DiscoverySettings } from "~/lib/api/types/discovery";

export function NotificationsCard({ settings }: { settings: DiscoverySettings }) {
	const form = useForm<DiscoveryNotificationSettings>({
		defaultValues: settings.notifications,
	});
	const updateSettings = useUpdateDiscoverySettings();
	const testNotification = useTestTelegramNotification();

	function save(notifications: DiscoveryNotificationSettings) {
		updateSettings.mutate(
			{ ...settings, notifications },
			{ onSuccess: () => toast.success("Telegram notifications saved") }
		);
	}

	function test() {
		const notifications = form.getValues();
		if (!notifications.telegramBotToken.trim()) {
			form.setError("telegramBotToken", { message: "Bot token is required" });
			return;
		}
		if (!notifications.telegramChatId.trim()) {
			form.setError("telegramChatId", { message: "Chat ID is required" });
			return;
		}
		testNotification.mutate(notifications, {
			onSuccess: () => toast.success("Test message delivered to Telegram"),
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Bell className="size-4" />
					Telegram notifications
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(save)} className="space-y-4">
						<div className="flex items-start justify-between gap-4 rounded-lg border p-3">
							<div>
								<Label htmlFor="telegram-enabled">Enable Telegram</Label>
								<p className="mt-1 text-xs text-muted-foreground">
									Send a digest when a new vacancy meets the notification score.
								</p>
							</div>
							<Controller
								control={form.control}
								name="telegramEnabled"
								render={({ field }) => (
									<Switch
										id="telegram-enabled"
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="telegramBotToken"
								rules={{
									validate: (value) =>
										!form.getValues("telegramEnabled") ||
										Boolean(value.trim()) ||
										"Bot token is required",
								}}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Bot token</FormLabel>
										<FormControl>
											<Input
												type="password"
												autoComplete="off"
												placeholder="123456:ABC..."
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="telegramChatId"
								rules={{
									validate: (value) =>
										!form.getValues("telegramEnabled") ||
										Boolean(value.trim()) ||
										"Chat ID is required",
								}}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Chat ID</FormLabel>
										<FormControl>
											<Input placeholder="123456789" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							Create a bot with BotFather, send it a message, then enter the target
							chat ID.
						</p>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={test}
								disabled={testNotification.isPending}
							>
								<Send />
								{testNotification.isPending ? "Sending..." : "Send test"}
							</Button>
							<Button type="submit" disabled={updateSettings.isPending}>
								{updateSettings.isPending ? "Saving..." : "Save notifications"}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
