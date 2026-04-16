import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
    },
    accountNumber: {
      type: String,
      unique: true,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },
    currency: {
      type: String,
      default: "EGP",
    },
    status: {
      type: String,
      enum: ["active", "frozen", "closed"],
      default: "active",
    },
  },
  { timestamps: true }
);


accountSchema.pre("save", async function (next) {
  if (this.isNew && !this.accountNumber) {
    this.accountNumber = "ACC" + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

const Account = mongoose.model("Account", accountSchema);
export default Account;
