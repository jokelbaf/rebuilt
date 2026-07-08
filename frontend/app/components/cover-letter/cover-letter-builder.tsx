import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { DocumentOverlay } from "~/components/builder/document-overlay";
import { DonePanel } from "~/components/builder/done-panel";
import { ExportPanel } from "~/components/builder/export-panel";
import { GeneratePanel } from "~/components/builder/generate-panel";
import { SelectTemplateStep } from "~/components/builder/select-template-step";
import { SelectResumeStep } from "~/components/cover-letter/select-resume-step";
import { useCoverLetterBuilder } from "~/components/cover-letter/use-cover-letter-builder";
import { PageBody, PageHeader } from "~/components/layout/page";
import { StepCard } from "~/components/stepper/step-card";
import { Stepper } from "~/components/stepper/stepper";
import { StepperNav } from "~/components/stepper/stepper-nav";
import { fade } from "~/lib/motion";

const STEPS = ["Resume", "Template", "Generate", "Export", "Done"];

export function CoverLetterBuilder() {
	const { state, actions, status } = useCoverLetterBuilder();
	const [step, setStep] = useState(0);
	const [overlayOpen, setOverlayOpen] = useState(false);

	const canProceed = [
		Boolean(state.resumeId),
		Boolean(state.templateId),
		Boolean(state.generated),
		Boolean(state.exportResult),
		false,
	][step];

	function renderStep() {
		switch (step) {
			case 0:
				return (
					<StepCard
						title="Select a resume"
						description="The cover letter is linked to the resume's vacancy and language."
					>
						<SelectResumeStep value={state.resumeId} onChange={actions.setResumeId} />
					</StepCard>
				);
			case 1:
				return (
					<StepCard
						title="Select a template"
						description="Choose the HTML template used to render the cover letter."
					>
						<SelectTemplateStep
							value={state.templateId}
							onChange={actions.setTemplateId}
						/>
					</StepCard>
				);
			case 2:
				return (
					<StepCard
						title="Generate cover letter"
						description="Generate the cover letter, then review or edit the result."
					>
						<GeneratePanel
							notes={state.notes}
							onNotesChange={actions.setNotes}
							onGenerate={actions.generateDocument}
							isGenerating={status.isGenerating}
							hasResult={Boolean(state.generated)}
							onView={() => setOverlayOpen(true)}
						/>
					</StepCard>
				);
			case 3:
				return (
					<StepCard
						title="Export to PDF"
						description="Export the final cover letter as a PDF file."
					>
						<ExportPanel
							onExport={actions.exportDocument}
							isExporting={status.isExporting}
							result={state.exportResult}
						/>
					</StepCard>
				);
			default:
				return (
					<DonePanel
						onDownload={actions.downloadDocument}
						isSaving={status.isSaving}
						label="Download Cover Letter"
						description="Your cover letter is ready. Downloading also links it back to the resume."
					/>
				);
		}
	}

	return (
		<>
			<PageHeader
				title="Cover Letter"
				description="Generate a cover letter for a finished resume."
			/>
			<PageBody className="max-w-3xl space-y-8">
				<Stepper steps={STEPS} current={step} onStepSelect={setStep} />
				<AnimatePresence mode="wait">
					<motion.div
						key={step}
						variants={fade}
						initial="hidden"
						animate="visible"
						exit={{ opacity: 0 }}
					>
						{renderStep()}
					</motion.div>
				</AnimatePresence>
				{step < STEPS.length - 1 && (
					<StepperNav
						onBack={step > 0 ? () => setStep(step - 1) : undefined}
						onNext={() => setStep(step + 1)}
						nextDisabled={!canProceed}
						backDisabled={step === 0}
					/>
				)}
			</PageBody>
			<DocumentOverlay
				open={overlayOpen}
				onOpenChange={setOverlayOpen}
				html={state.html}
				onSave={actions.setHtml}
				title="Edit cover letter"
			/>
		</>
	);
}
