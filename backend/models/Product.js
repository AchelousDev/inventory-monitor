/**
 * Product.js — Mongoose model for one monitored inventory item.
 *
 * The schema was extended beyond basic name/url/status so we can:
 * - Record every mock "check" in history (audit trail of what the monitor saw).
 * - Flag when the latest check actually changed status (statusChanged), which
 *   lets the UI highlight surprises without parsing the whole history array.
 * - Store lastStatusChange only when a transition happens, so the UI can show
 *   "when did it last flip?" separately from "when did we last poll?"
 *
 * What is a schema?
 * - A schema describes the shape of documents: field names, types, defaults,
 *   and validation. Mongoose uses it before data reaches MongoDB.
 *
 * What is a model?
 * - A model is how you query the collection: Product.find(), Product.create(), etc.
 */

import mongoose from "mongoose";

/**
 * One snapshot from a single check. We append one entry on every PATCH check
 * so MongoDB keeps an ordered log the frontend can summarize (e.g. last 3).
 */
const historyItemSchema = new mongoose.Schema(
  {
    previousStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    checkedAt: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Out of Stock",
    },
    lastChecked: {
      type: String,
      required: true,
    },
    /**
     * When the status last transitioned to something different (optional until
     * the first change happens).
     */
    lastStatusChange: {
      type: String,
      required: false,
    },
    /**
     * True if the most recent check ended on a different status than before.
     * The frontend uses this to show a small "Changed" badge without scanning
     * the history array on every render.
     */
    statusChanged: {
      type: Boolean,
      default: false,
    },
    /**
     * Ordered log of mock checks. Grows with each PATCH /check; older clients
     * or small UIs can slice the tail (e.g. last 3) for display.
     */
    history: {
      type: [historyItemSchema],
      default: [],
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

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
