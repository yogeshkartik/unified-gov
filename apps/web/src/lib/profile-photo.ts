const profilePhotoChangedEvent = "unified-gov:profile-photo-changed";

/** Notify avatar consumers after the canonical Photograph changes. */
export function notifyProfilePhotoChanged() {
  window.dispatchEvent(new Event(profilePhotoChangedEvent));
}

export { profilePhotoChangedEvent };
