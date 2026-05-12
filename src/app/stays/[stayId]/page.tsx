"use client";

import { useParams, useRouter } from "next/navigation";

import { PartnerShell } from "@/components/common/partner-shell";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import { StayActionsSection } from "./stay-actions-section";
import { StayDetailsForm } from "./stay-details-form";
import { StayImagesSection } from "./stay-images-section";
import { StayRoomsSection } from "./stay-rooms-section";
import { useStayDetail } from "./use-stay-detail";

export default function StayDetailPage() {
  const router = useRouter();
  const params = useParams<{ stayId: string }>();
  const stayId = params.stayId;

  const { user, loading } = usePartnerAccess();
  const detail = useStayDetail(user?.id, stayId);

  if (loading || !detail.stay || !user) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading stay...</p>
        </div>
      </main>
    );
  }

  const { stay, qualityReport } = detail;

  return (
    <PartnerShell
      title={stay.name || "Stay Draft"}
      description="Edit listing details, media, rooms, and lifecycle status."
      headerExtra={
        <p className="tm-muted text-sm">
          Status: {stay.status === "paused_by_admin" ? "Suspended by platform" : stay.status}
        </p>
      }
    >
      <StayActionsSection
        stay={stay}
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
        onBack={() => router.push("/stays")}
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
        {stay.status === "rejected" && stay.moderationFeedback ? (
          <p className="mt-3 text-sm text-slate-700">
            Correction workflow: apply moderation feedback, resolve quality warnings, then re-submit.
          </p>
        ) : null}
        {stay.status === "paused_by_admin" ? (
          <p className="mt-3 text-sm text-amber-700">
            This listing is suspended. Quality improvements cannot be submitted until the platform releases the restriction.
          </p>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <StayDetailsForm
            stay={stay}
            saving={detail.saving}
            canEditDetails={detail.canEditDetails}
            selectedAmenities={detail.selectedAmenities}
            selectedPropertyType={detail.selectedPropertyType}
            selectedCountry={detail.selectedCountry}
            selectedCity={detail.selectedCity}
            citySearch={detail.citySearch}
            propertyTypeOptions={detail.propertyTypeOptions}
            amenityOptions={detail.amenityOptions}
            filteredCities={detail.filteredCities}
            knownPropertyTypeValues={detail.knownPropertyTypeValues}
            knownAmenityValues={detail.knownAmenityValues}
            onSaveDetails={detail.saveDetails}
            onRefresh={detail.refresh}
            onToggleAmenity={detail.toggleAmenity}
            onSetPropertyType={detail.setSelectedPropertyType}
            onSetCountry={(v) => {
              detail.setSelectedCountry(v);
              detail.setSelectedCity("");
              detail.setCitySearch("");
            }}
            onSetCity={detail.setSelectedCity}
            onSetCitySearch={detail.setCitySearch}
          />

          <StayRoomsSection
            stay={stay}
            roomName={detail.roomName}
            roomOccupancy={detail.roomOccupancy}
            roomBed={detail.roomBed}
            roomRate={detail.roomRate}
            roomIsBookable={detail.roomIsBookable}
            roomTotalInventory={detail.roomTotalInventory}
            roomMaxPerBooking={detail.roomMaxPerBooking}
            roomFormMessage={detail.roomFormMessage}
            onSetRoomName={detail.setRoomName}
            onSetRoomOccupancy={detail.setRoomOccupancy}
            onSetRoomBed={detail.setRoomBed}
            onSetRoomRate={detail.setRoomRate}
            onSetRoomIsBookable={detail.setRoomIsBookable}
            onSetRoomTotalInventory={detail.setRoomTotalInventory}
            onSetRoomMaxPerBooking={detail.setRoomMaxPerBooking}
            onAddRoom={detail.addRoom}
            onRemoveRoom={detail.removeRoom}
            onAddRoomImage={(file, roomId) => void detail.addImage(file, roomId)}
            onMoveImageToProperty={(imageId) => void detail.assignImageToRoom(imageId, null)}
            onRemoveImage={detail.removeImage}
          />
        </div>

        <StayImagesSection
          stay={stay}
          uploadState={detail.uploadState}
          spaceTypeOptions={detail.spaceTypeOptions}
          onAddImage={detail.addImage}
          onReplaceImage={detail.replaceImage}
          onRemoveImage={detail.removeImage}
          onMoveImage={detail.moveImage}
          onAssignImageToRoom={detail.assignImageToRoom}
          onAssignImageSpaceType={detail.assignImageSpaceType}
        />
      </section>
    </PartnerShell>
  );
}
