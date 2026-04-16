import Account from "../../DB/models/account.model.js";
import Transaction from "../../DB/models/transaction.model.js";
import mongoose from "mongoose";


export const getMyAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({ userId: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found." });
    }

    return res.status(200).json({ success: true, data: { account } });
  } catch (error) {
    next(error);
  }
};


export const deposit = async (req, res, next) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be a positive number." });
    }

    const account = await Account.findOne({ userId: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: "Account not found." });

    if (account.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Cannot perform transactions. Account is ${account.status}.`,
      });
    }

    const balanceBefore = account.balance;
    account.balance += amount;
    await account.save();

    const transaction = await Transaction.create({
      accountId: account._id,
      type: "deposit",
      amount,
      balanceBefore,
      balanceAfter: account.balance,
      description: description || "Deposit",
    });

    return res.status(200).json({
      success: true,
      message: "Deposit successful.",
      data: { transaction, newBalance: account.balance },
    });
  } catch (error) {
    next(error);
  }
};


export const withdraw = async (req, res, next) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be a positive number." });
    }

    const account = await Account.findOne({ userId: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: "Account not found." });

    if (account.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Cannot perform transactions. Account is ${account.status}.`,
      });
    }

    if (account.balance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${account.balance}`,
      });
    }

    const balanceBefore = account.balance;
    account.balance -= amount;
    await account.save();

    const transaction = await Transaction.create({
      accountId: account._id,
      type: "withdraw",
      amount,
      balanceBefore,
      balanceAfter: account.balance,
      description: description || "Withdrawal",
    });

    return res.status(200).json({
      success: true,
      message: "Withdrawal successful.",
      data: { transaction, newBalance: account.balance },
    });
  } catch (error) {
    next(error);
  }
};


export const transfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, toAccountNumber, description } = req.body;

    if (!amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Amount must be a positive number." });
    }

    const senderAccount = await Account.findOne({ userId: req.user._id }).session(session);
    if (!senderAccount) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Your account not found." });
    }

    if (senderAccount.status !== "active") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot transfer. Your account is ${senderAccount.status}.`,
      });
    }

    if (senderAccount.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${senderAccount.balance}`,
      });
    }

    const receiverAccount = await Account.findOne({ accountNumber: toAccountNumber }).session(session);
    if (!receiverAccount) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Recipient account not found." });
    }

    if (receiverAccount._id.equals(senderAccount._id)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Cannot transfer to your own account." });
    }

    if (receiverAccount.status !== "active") {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Recipient account is not active." });
    }

  
    const senderBalanceBefore = senderAccount.balance;
    senderAccount.balance -= amount;
    await senderAccount.save({ session });


    const receiverBalanceBefore = receiverAccount.balance;
    receiverAccount.balance += amount;
    await receiverAccount.save({ session });


    await Transaction.create(
      [
        {
          accountId: senderAccount._id,
          type: "transfer",
          amount,
          balanceBefore: senderBalanceBefore,
          balanceAfter: senderAccount.balance,
          relatedAccountId: receiverAccount._id,
          description: description || `Transfer to ${toAccountNumber}`,
        },
      ],
      { session }
    );

    await Transaction.create(
      [
        {
          accountId: receiverAccount._id,
          type: "transfer",
          amount,
          balanceBefore: receiverBalanceBefore,
          balanceAfter: receiverAccount.balance,
          relatedAccountId: senderAccount._id,
          description: `Transfer received from ${senderAccount.accountNumber}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Transfer successful.",
      data: { amount, newBalance: senderAccount.balance },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};


export const getSummary = async (req, res, next) => {
  try {
    const account = await Account.findOne({ userId: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: "Account not found." });

    const [summary] = await Transaction.aggregate([
      { $match: { accountId: account._id } },
      {
        $group: {
          _id: null,
          totalDeposits: { $sum: { $cond: [{ $eq: ["$type", "deposit"] }, "$amount", 0] } },
          totalWithdrawals: { $sum: { $cond: [{ $eq: ["$type", "withdraw"] }, "$amount", 0] } },
          totalTransfers: { $sum: { $cond: [{ $eq: ["$type", "transfer"] }, "$amount", 0] } },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        currentBalance: account.balance,
        summary: summary || { totalDeposits: 0, totalWithdrawals: 0, totalTransfers: 0, transactionCount: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStatement = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const account = await Account.findOne({ userId: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: "Account not found." });

    const filter = { accountId: account._id };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { account: { accountNumber: account.accountNumber, balance: account.balance }, transactions },
    });
  } catch (error) {
    next(error);
  }
};
