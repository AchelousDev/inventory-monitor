/**
 * Notification.js — Mongoose model for a single “alert” when inventory status changes.
 *
 * What this represents:
 * - A human-readable record that something worth attention happened (here: a
 *   mock check produced a new status). In a real system you might email or push
 *   from similar rows; we only store them for the dashboard feed.
 *
 * Why separate from Product?
 * - Product documents hold current state and check history on that product.
 *   Notifications are a cross-product timeline: many products, one stream.
 * - You can list “what changed recently” without scanning every product’s
 *   history array or coupling the product schema to alert text.
 *
 * How this supports monitoring:
 * - Operators care about *events* (“this SKU flipped to in stock”), not only
 *   the latest field values. A dedicated collection models that event stream.
 */

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    /** Same string id the frontend uses for the product (Mongo _id as string). */
    productId: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    /** Full sentence shown in the UI, e.g. "Mouse changed from X to Y". */
    message: {
      type: String,
      required: true,
    },
    previousStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
    /** Localized timestamp string (matches other “display” times in this app). */
    createdAt: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
