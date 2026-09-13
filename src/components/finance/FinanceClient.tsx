"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";

type Account = { id: string; name: string; type: string; balance: number };
type Transaction = {
  id: string;
  accountId: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  isIncome: boolean;
};
type BudgetT = { id: string; category: string; monthlyLimit: number; month: string };

export default function FinanceClient() {
  const queryClient = useQueryClient();
  const { data: accounts } = useQuery<Account[]>({ queryKey: ["accounts"], queryFn: () => apiFetch("/api/finance/accounts") });
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: () => apiFetch("/api/finance/transactions"),
  });
  const { data: budgets } = useQuery<BudgetT[]>({ queryKey: ["budgets"], queryFn: () => apiFetch("/api/finance/budgets") });
  const { data: settings } = useQuery<{ currency: string }>({ queryKey: ["settings"], queryFn: () => apiFetch("/api/settings") });
  const currency = settings?.currency || DEFAULT_CURRENCY;

  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState("checking");
  const createAccount = useMutation({
    mutationFn: () => apiFetch("/api/finance/accounts", { method: "POST", body: JSON.stringify({ name: accName, type: accType }) }),
    onSuccess: () => {
      setAccName("");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const [txAccount, setTxAccount] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txIsIncome, setTxIsIncome] = useState(false);
  const createTx = useMutation({
    mutationFn: () =>
      apiFetch("/api/finance/transactions", {
        method: "POST",
        body: JSON.stringify({
          accountId: txAccount,
          amount: Number(txAmount),
          category: txCategory,
          date: new Date(),
          isIncome: txIsIncome,
        }),
      }),
    onSuccess: () => {
      setTxAmount("");
      setTxCategory("");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const [budCategory, setBudCategory] = useState("");
  const [budLimit, setBudLimit] = useState("");
  const createBudget = useMutation({
    mutationFn: () =>
      apiFetch("/api/finance/budgets", {
        method: "POST",
        body: JSON.stringify({ category: budCategory, monthlyLimit: Number(budLimit), month: format(new Date(), "yyyy-MM") }),
      }),
    onSuccess: () => {
      setBudCategory("");
      setBudLimit("");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const totalBalance = (accounts || []).reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-5">
      <div className="card">
        <p className="text-sm text-ink-light">Total balance</p>
        <p className="font-serif text-3xl text-sage-600">{formatCurrency(totalBalance, currency)}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-serif text-lg">Accounts</h2>
          <ul className="mb-3 space-y-2">
            {(accounts || []).map((a) => (
              <li key={a.id} className="flex justify-between text-sm">
                <span>{a.name} <span className="text-ink-light">({a.type})</span></span>
                <span className={cn(a.balance < 0 && "text-red-500")}>{formatCurrency(a.balance, currency)}</span>
              </li>
            ))}
            {(accounts || []).length === 0 && <p className="text-sm text-ink-light">No accounts yet.</p>}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (accName.trim()) createAccount.mutate();
            }}
            className="flex gap-2"
          >
            <input className="input" placeholder="Account name" value={accName} onChange={(e) => setAccName(e.target.value)} />
            <select className="input" value={accType} onChange={(e) => setAccType(e.target.value)}>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit</option>
              <option value="cash">Cash</option>
            </select>
            <button className="btn-secondary px-3">
              <Plus size={14} />
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="mb-3 font-serif text-lg">Budgets ({format(new Date(), "MMM yyyy")})</h2>
          <ul className="mb-3 space-y-2">
            {(budgets || []).map((b) => (
              <li key={b.id} className="flex justify-between text-sm">
                <span>{b.category}</span>
                <span>{formatCurrency(b.monthlyLimit, currency)}/mo</span>
              </li>
            ))}
            {(budgets || []).length === 0 && <p className="text-sm text-ink-light">No budgets yet.</p>}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (budCategory.trim() && budLimit) createBudget.mutate();
            }}
            className="flex gap-2"
          >
            <input className="input" placeholder="Category" value={budCategory} onChange={(e) => setBudCategory(e.target.value)} />
            <input className="input" placeholder="Limit" type="number" value={budLimit} onChange={(e) => setBudLimit(e.target.value)} />
            <button className="btn-secondary px-3">
              <Plus size={14} />
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-serif text-lg">Transactions</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (txAccount && txAmount && txCategory) createTx.mutate();
          }}
          className="mb-4 flex flex-col gap-2 sm:flex-row"
        >
          <select className="input" value={txAccount} onChange={(e) => setTxAccount(e.target.value)}>
            <option value="">Select account</option>
            {(accounts || []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input className="input" placeholder="Amount" type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} />
          <input className="input" placeholder="Category" value={txCategory} onChange={(e) => setTxCategory(e.target.value)} />
          <label className="flex items-center gap-1 text-sm whitespace-nowrap">
            <input type="checkbox" checked={txIsIncome} onChange={(e) => setTxIsIncome(e.target.checked)} /> Income
          </label>
          <button className="btn-primary">
            <Plus size={14} /> Add
          </button>
        </form>
        <ul className="divide-y divide-cream-300">
          {(transactions || []).map((t) => (
            <li key={t.id} className="flex justify-between py-2 text-sm">
              <span>
                {t.category} · {format(new Date(t.date), "MMM d")}
              </span>
              <span className={t.isIncome ? "text-sage-600" : "text-red-500"}>
                {t.isIncome ? "+" : "-"}{formatCurrency(t.amount, currency)}
              </span>
            </li>
          ))}
          {(transactions || []).length === 0 && <p className="py-2 text-sm text-ink-light">No transactions yet.</p>}
        </ul>
      </div>
    </div>
  );
}
