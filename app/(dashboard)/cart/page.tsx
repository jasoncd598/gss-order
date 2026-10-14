'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight,
  CheckCircle2, RefreshCw, FileText, ShieldCheck,
  AlertCircle, Loader2,
} from 'lucide-react';
import { useCart } from '../../lib/cartContext';
import { useUser } from '../../lib/userContext';
import { formatAUD } from '../../lib/utils';
import { createOrderCheckoutAction, placeOrderAction } from '../../lib/actions';
import ArtworkThumb from '../../component/ArtworkThumb';
import PayOrderButton from '../../component/PayOrderButton';

type Step = 'cart' | 'review' | 'confirmed';

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart } = useCart();
  const { companyName, paymentTerms } = useUser();
  const [poRef, setPoRef]             = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [step, setStep]               = useState<Step>('cart');
  const [orderRef, setOrderRef]       = useState('');
  const [orderId, setOrderId]         = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
  const [placing, setPlacing]         = useState(false);
  const [placeError, setPlaceError]   = useState('');

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const gst      = subtotal * 0.1;
  const total    = subtotal + gst;
  const prepaid  = paymentTerms === 'Prepaid';

  async function handlePlaceOrder() {
    setPlacing(true);
    setPlaceError('');

    const result = await placeOrderAction({
      // Prices are set by the database from your last order of each plate
      items: items.map((i) => ({ plateRef: i.plateRef, quantity: i.quantity })),
      poRef:  poRef  || undefined,
      notes:  deliveryNote || undefined,
    });

    if (!result.success) {
      setPlacing(false);
      setPlaceError(result.error ?? 'Something went wrong. Please try again.');
      return;
    }

    clearCart();

    // Prepaid accounts pay before production — go straight to Stripe Checkout.
    // If that fails, the confirmation screen still offers the pay button.
    if (prepaid && result.orderId) {
      const checkout = await createOrderCheckoutAction(result.orderId);
      if (checkout.success && checkout.url) {
        window.location.assign(checkout.url);
        return;
      }
    }

    setPlacing(false);
    if (result.orderId) setOrderId(result.orderId);
    if (result.ref) setOrderRef(result.ref);
    setConfirmedTotal(result.total !== undefined ? result.total * 1.1 : total);
    setStep('confirmed');
  }

  function stepQty(artId: string, delta: number, minQty: number, currentQty: number) {
    const next = Math.max(minQty, currentQty + delta);
    updateQty(artId, next);
  }

  if (step === 'confirmed') {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center px-4">
        <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-black text-zinc-900 mb-2">Order Submitted!</h1>
        <p className="text-zinc-500 text-sm mb-1">
          Your purchase order <span className="font-mono font-bold text-zinc-900">{orderRef}</span> has been received.
        </p>
        <p className="text-zinc-400 text-xs mb-8">
          Our production team will review and confirm within 1 business day. You&apos;ll get a notification here as it moves through production.
        </p>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-left mb-6 space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-zinc-400">Order Reference</span>
            <span className="font-bold text-zinc-900">{orderRef}</span>
          </div>
          {poRef && (
            <div className="flex justify-between">
              <span className="text-zinc-400">Your PO Reference</span>
              <span className="font-bold text-zinc-900">{poRef}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-400">Estimated Total</span>
            <span className="font-bold text-emerald-600">{formatAUD(confirmedTotal ?? total)} <span className="text-zinc-400 font-normal">inc. GST</span></span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Payment Terms</span>
            <span className="font-bold text-zinc-900">{paymentTerms}</span>
          </div>
        </div>
        {orderId && (
          <div className={`rounded-xl p-4 mb-6 text-left ${prepaid ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-zinc-200'}`}>
            <p className="text-xs text-zinc-600 mb-3">
              {prepaid
                ? 'Your account is on prepaid terms — production starts once payment is received.'
                : `Prefer to pay now instead of on ${paymentTerms} terms? You can pay this order by card.`}
            </p>
            <PayOrderButton orderId={orderId} label={prepaid ? 'Pay Now' : 'Pay by Card'} />
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/order"
            className="inline-flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            <span>View Order History</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center space-x-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-amber-500" />
            <span>{step === 'cart' ? 'Cart & Checkout' : 'Review Order'}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {items.length} item{items.length !== 1 ? 's' : ''} · {companyName}
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          {(['cart', 'review'] as const).map((s, i) => (
            <div key={s} className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1.5 font-semibold ${step === s ? 'text-zinc-900' : s === 'cart' && step === 'review' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border ${step === s ? 'bg-amber-400 border-amber-400 text-zinc-950' : s === 'cart' && step === 'review' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 text-zinc-400'}`}>
                  {s === 'cart' && step === 'review' ? '✓' : i + 1}
                </div>
                <span className="capitalize hidden sm:block">{s === 'cart' ? 'Items' : 'Review'}</span>
              </div>
              {i < 1 && <div className="w-8 h-px bg-zinc-300" />}
            </div>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h2 className="text-zinc-600 font-semibold mb-2">Your cart is empty</h2>
          <p className="text-zinc-400 text-xs mb-4">Add products from the catalog to get started.</p>
          <Link href="/catalog" className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">
            <ShoppingCart className="w-4 h-4" />
            <span>Browse Catalog</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.artId} className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                    <ArtworkThumb name={item.name} plateRef={item.plateRef} previewUrl={item.previewUrl} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-zinc-900 text-sm leading-tight">{item.name}</h3>
                        <p className="text-amber-600 font-mono text-[11px] mt-0.5">{item.plateRef}</p>
                      </div>
                      {step === 'cart' && (
                        <button onClick={() => removeItem(item.artId)} className="text-zinc-300 hover:text-red-500 transition-colors ml-2 shrink-0" aria-label="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 mt-2 text-[11px] font-mono text-zinc-500">
                      <span>{item.dimensions}</span>
                      <span className="hidden sm:block">·</span>
                      <span>{item.substrate}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      {step === 'cart' ? (
                        <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden">
                          <button onClick={() => stepQty(item.artId, -item.minQty, item.minQty, item.quantity)} className="px-2.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 font-bold transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            min={1}
                            onChange={(e) => updateQty(item.artId, parseInt(e.target.value) || 1)}
                            className="w-20 text-center text-xs font-mono font-bold py-1.5 bg-white border-x border-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                          <button onClick={() => stepQty(item.artId, item.minQty, item.minQty, item.quantity)} className="px-2.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 font-bold transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-mono font-bold text-zinc-700">{item.quantity.toLocaleString()} units</span>
                      )}
                      <div className="text-right">
                        <div className="text-[10px] text-zinc-400 font-mono">{formatAUD(item.unitPrice)} ea</div>
                        <div className="font-bold text-zinc-900 font-mono text-sm">{formatAUD(item.unitPrice * item.quantity)}</div>
                      </div>
                    </div>
                    {step === 'cart' && (
                      <p className="text-[10px] text-zinc-400 mt-1.5 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Last run: {item.minQty.toLocaleString()} units · price confirmed at checkout</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {step === 'cart' && (
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Order Details</h3>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Purchase Order Reference <span className="text-zinc-400 font-normal">(optional)</span></label>
                  <input type="text" value={poRef} onChange={(e) => setPoRef(e.target.value)} placeholder="e.g. PO-ACME-0042" className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Delivery Instructions <span className="text-zinc-400 font-normal">(optional)</span></label>
                  <textarea value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} rows={2} placeholder="e.g. Deliver to Warehouse B, Dock 3" className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none" />
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-xs font-mono space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 font-sans">Order Summary</h3>
                {poRef && <div className="flex justify-between"><span className="text-zinc-400">PO Reference</span><span className="font-bold text-zinc-800">{poRef}</span></div>}
                {deliveryNote && <div className="flex justify-between"><span className="text-zinc-400">Delivery Note</span><span className="font-semibold text-zinc-700 max-w-[200px] text-right">{deliveryNote}</span></div>}
                <div className="flex justify-between"><span className="text-zinc-400">Payment Terms</span><span className="font-bold text-zinc-800">{paymentTerms}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Delivery Address</span><span className="font-semibold text-zinc-700 max-w-[200px] text-right">{deliveryNote || 'Default warehouse address'}</span></div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Price Summary</h3>
              <div className="space-y-2.5 text-xs font-mono">
                {items.map((i) => (
                  <div key={i.artId} className="flex justify-between text-zinc-600">
                    <span className="truncate mr-2 max-w-[140px]">{i.name}</span>
                    <span className="font-semibold text-zinc-800">{formatAUD(i.unitPrice * i.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-zinc-100 pt-2.5 flex justify-between text-zinc-600">
                  <span>Subtotal</span><span className="font-semibold">{formatAUD(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>GST (10%)</span><span>{formatAUD(gst)}</span>
                </div>
                <div className="border-t-2 border-zinc-200 pt-2.5 flex justify-between font-black text-zinc-900 text-sm">
                  <span>Total (AUD)</span><span>{formatAUD(total)}</span>
                </div>
              </div>

              {step === 'cart' ? (
                <button onClick={() => setStep('review')} className="w-full mt-4 flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-2.5 rounded-lg text-sm transition-colors">
                  <span>Review Order</span><ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="space-y-2 mt-4">
                  {placeError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start space-x-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{placeError}</span>
                    </p>
                  )}
                  <button onClick={handlePlaceOrder} disabled={placing} className="w-full flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 disabled:cursor-not-allowed text-zinc-950 font-bold py-2.5 rounded-lg text-sm transition-colors">
                    {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{placing ? 'Placing order…' : prepaid ? 'Place Order & Pay' : 'Place Order'}</span>
                  </button>
                  <button onClick={() => setStep('cart')} disabled={placing} className="w-full border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium py-2 rounded-lg text-xs transition-colors disabled:opacity-50">
                    Edit Cart
                  </button>
                </div>
              )}
            </div>

            <div className="bg-zinc-900 rounded-xl p-4 space-y-2.5">
              {[
                { icon: ShieldCheck, text: prepaid ? 'Prepaid — pay securely by card via Stripe' : `${paymentTerms} Terms — or pay by card anytime` },
                { icon: FileText,    text: 'Invoice sent to your Xero account' },
                { icon: RefreshCw,   text: 'Artwork plates already approved' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center space-x-2.5 text-[11px] text-zinc-300">
                  <Icon className="w-4 h-4 text-amber-400 shrink-0" /><span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
