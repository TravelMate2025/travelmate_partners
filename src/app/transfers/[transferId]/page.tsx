"use client";

import { useParams, useRouter } from "next/navigation";

import { PartnerShell } from "@/components/common/partner-shell";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import { TransferActionsSection } from "./transfer-actions-section";
import { TransferDetailsForm } from "./transfer-details-form";
import { TransferImagesSection } from "./transfer-images-section";
import { useTransferDetail } from "./use-transfer-detail";

export default function TransferDetailPage() {
  const { user, loading } = usePartnerAccess();
  const router = useRouter();
  const params = useParams<{ transferId: string }>();
  const transferId = params.transferId;

  const detail = useTransferDetail(user?.id, transferId);

  if (loading || !detail.item || !user) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading transfer...</p>
        </div>
      </main>
    );
  }

  const { item, qualityReport } = detail;

  return (
    <PartnerShell
      title={item.name || "Transfer Draft"}
      description="Edit route, vehicle, pricing, and listing lifecycle details."
      headerExtra={
        <p className="tm-muted text-sm">
          Status: {item.status === "paused_by_admin" ? "Suspended by platform" : item.status}
        </p>
      }
    >
      <TransferActionsSection
        item={item}
        saving={detail.saving}
        canSubmit={detail.canSubmit}
        appeal={detail.appeal}
        showAppealForm={detail.showAppealForm}
        appealMessage={detail.appealMessage}
        appealMessageTouched={detail.appealMessageTouched}
        submittingAppeal={detail.submittingAppeal}
        onSetShowAppealForm={detail.setShowAppealForm}
        onSetAppealMessage={detail.setAppealMessage}
        onSetAppealMessageTouched={detail.setAppealMessageTouched}
        onSubmitAppeal={detail.submitAppeal}
        onChangeStatus={detail.changeStatus}
        onArchive={detail.archive}
        onNavigatePricing={() => router.push(`/transfer-pricing-scheduling?transferId=${item.id}`)}
        onBack={() => router.push("/transfers")}
      />

      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Data Quality</h2>
        <p className="tm-muted mt-1 text-sm">Submission readiness checks, completeness score, and duplicate warnings.</p>
        <p className="mt-3 text-sm font-semibold text-slate-800">
          Completeness score: {qualityReport?.completenessScore ?? 0}%
        </p>
        {qualityReport && qualityReport.missingRequiredFields.length > 0 ? (
          <p className="mt-2 text-sm text-rose-700">
            Missing required fields: {qualityReport.missingRequiredFields.join(", ")}.
          </p>
        ) : (
          <p className="mt-2 text-sm text-emerald-700">Required submission fields are complete.</p>
        )}
        {qualityReport && qualityReport.duplicateWarnings.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {qualityReport.duplicateWarnings.map((warning) => (
              <li key={warning} className="text-sm text-amber-700">{warning}</li>
            ))}
          </ul>
        ) : null}
        {item.status === "rejected" && item.moderationFeedback ? (
          <p className="mt-3 text-sm text-slate-700">
            Correction workflow: apply moderation feedback, resolve quality warnings, then re-submit.
          </p>
        ) : null}
        {item.status === "paused_by_admin" ? (
          <p className="mt-3 text-sm text-amber-700">
            This listing is suspended. Quality improvements cannot be submitted until the platform releases the restriction.
          </p>
        ) : null}
      </section>

      <TransferDetailsForm
        item={item}
        saving={detail.saving}
        canEditDetails={detail.canEditDetails}
        selectedFeatures={detail.selectedFeatures}
        selectedCurrency={detail.selectedCurrency}
        openTime={detail.openTime}
        closeTime={detail.closeTime}
        selectedCountry={detail.selectedCountry}
        selectedCity={detail.selectedCity}
        citySearch={detail.citySearch}
        selectedVehicleClass={detail.selectedVehicleClass}
        vehicleClassOptions={detail.vehicleClassOptions}
        filteredCities={detail.filteredCities}
        knownVehicleClassValues={detail.knownVehicleClassValues}
        knownFeatureValues={detail.knownFeatureValues}
        onSaveDetails={detail.saveDetails}
        onToggleFeature={detail.toggleFeature}
        onSetCurrency={detail.setSelectedCurrency}
        onSetOpenTime={detail.setOpenTime}
        onSetCloseTime={detail.setCloseTime}
        onSetCountry={(v) => {
          detail.setSelectedCountry(v);
          detail.setSelectedCity("");
          detail.setCitySearch("");
        }}
        onSetCity={detail.setSelectedCity}
        onSetCitySearch={detail.setCitySearch}
        onSetVehicleClass={detail.setSelectedVehicleClass}
      />

      <TransferImagesSection
        item={item}
        saving={detail.saving}
        uploadState={detail.uploadState}
        onAddImage={detail.addImage}
        onReplaceImage={detail.replaceImage}
        onRemoveImage={detail.removeImage}
        onMoveImage={detail.moveImage}
      />
    </PartnerShell>
  );
}
