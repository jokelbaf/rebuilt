import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { DocumentOverlay } from "~/components/builder/document-overlay";
import { DonePanel } from "~/components/builder/done-panel";
import { ExportPanel } from "~/components/builder/export-panel";
import { GeneratePanel } from "~/components/builder/generate-panel";
import { SelectTemplateStep } from "~/components/builder/select-template-step";
import { PageBody, PageHeader } from "~/components/layout/page";
import { LanguageStep } from "~/components/resume/language-step";
import { SelectVacancyStep } from "~/components/resume/select-vacancy-step";
import { useResumeBuilder } from "~/components/resume/use-resume-builder";
import { StepCard } from "~/components/stepper/step-card";
import { Stepper } from "~/components/stepper/stepper";
import { StepperNav } from "~/components/stepper/stepper-nav";
import { fade } from "~/lib/motion";

const STEPS = ["Vacancy", "Language", "Template", "Generate", "Export", "Done"];

export function ResumeBuilder() {
	const { state, actions, status } = useResumeBuilder();
	const [step, setStep] = useState(0);
	const [overlayOpen, setOverlayOpen] = useState(false);

	const canProceed = [
		Boolean(state.vacancyId),
		Boolean(state.language),
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
						title="Select a vacancy"
						description="Choose the vacancy this resume should target."
					>
						<SelectVacancyStep
							value={state.vacancyId}
							onChange={actions.selectVacancy}
						/>
					</StepCard>
				);
			case 1:
				return (
					<StepCard
						title="Choose language"
						description="Pick the language for the generated resume."
					>
						<LanguageStep
							value={state.language}
							onChange={actions.setLanguage}
							detected={state.selectedVacancy?.language}
						/>
					</StepCard>
				);
			case 2:
				return (
					<StepCard
						title="Select a template"
						description="Choose the HTML template used to render the resume."
					>
						<SelectTemplateStep
							value={state.templateId}
							onChange={actions.setTemplateId}
						/>
					</StepCard>
				);
			case 3:
				return (
					<StepCard
						title="Generate resume"
						description="Generate the resume, then review or edit the result."
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
			case 4:
				return (
					<StepCard
						title="Export to PDF"
						description="Export the final resume as a PDF file."
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
						label="Download Resume"
						description="Your resume is ready. Downloading also saves it alongside its metadata."
					/>
				);
		}
	}

	return (
		<>
			<PageHeader
				title="Resume"
				description="Generate a resume tailored to a specific vacancy."
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
				title="Edit resume"
			/>
		</>
	);
}
