/**
 * mockInventoryCheck.js — shared “fake inventory poll” logic for one Product document.
 *
 * Why extract this from server.js?
 * - The PATCH route and the cron scheduler must behave identically: same random
 *   statuses, same history rules, same notification rules. One function means
 *   one place to fix bugs or tweak behavior—duplicating the block in two spots
 *   would let them drift apart (classic maintenance pain).
 *
 * Why reuse matters:
 * - “Don’t repeat yourself” (DRY) keeps beginners from editing two copies when
 *   they add a fifth status or change how notifications work.
 *
 * Notifications:
 * - Still created only when status actually changes, whether the trigger was
 *   a user clicking “Check Status” or the timer firing in the background.
 */

import Notification from "../models/Notification.js";

/** Outcomes the mock monitor can return—keep in sync with the frontend filters. */
export const CHECK_STATUSES = [
  "In Stock",
  "Out of Stock",
  "Limited Stock",
  "Unknown",
];

/**
 * runMockInventoryCheckOnProduct(doc)
 *
 * @param {import("mongoose").Document} doc — loaded Product mongoose document (mutated in place)
 * @returns {Promise<{ didChange: boolean; notificationCreated: boolean }>}
 */
export async function runMockInventoryCheckOnProduct(doc) {
  const previousStatus = doc.status;
  const newStatus =
    CHECK_STATUSES[Math.floor(Math.random() * CHECK_STATUSES.length)];
  const checkedAt = new Date().toLocaleString();
  const didChange = previousStatus !== newStatus;

  doc.status = newStatus;
  doc.lastChecked = checkedAt;
  doc.statusChanged = didChange;

  if (didChange) {
    doc.lastStatusChange = checkedAt;
  }

  if (!Array.isArray(doc.history)) {
    doc.history = [];
  }

  doc.history.push({
    previousStatus,
    newStatus,
    checkedAt,
  });

  await doc.save();

  let notificationCreated = false;

  if (didChange) {
    const productName = doc.name;
    const message = `${productName} changed from ${previousStatus} to ${newStatus}`;
    try {
      await Notification.create({
        productId: doc._id.toString(),
        productName,
        message,
        previousStatus,
        newStatus,
        createdAt: checkedAt,
      });
      notificationCreated = true;
    } catch (notifyErr) {
      console.error(
        "[mockInventoryCheck] notification create failed:",
        notifyErr.message
      );
    }
  }

  return { didChange, notificationCreated };
}
