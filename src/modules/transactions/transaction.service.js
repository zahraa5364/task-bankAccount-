import Transaction from "../../DB/models/transaction.model.js";
import Account from "../../DB/models/account.model.js";

export const getMyTransactions = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;

    const account = await Account.findOne({ userId: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: "Account not found." });

    const filter = { accountId: account._id };
    if (type) filter.type = type;

    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getTransaction = async (req, res, next) => {
  try {
    const account = await Account.findOne({ userId: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: "Account not found." });

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      accountId: account._id, 
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    return res.status(200).json({ success: true, data: { transaction } });
  } catch (error) {
    next(error);
  }
};
