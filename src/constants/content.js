/* Static widget content. Articles/team are fallbacks — the API can override them. */
export const EMOJI = ['😀', '😊', '😂', '😍', '🙏', '👍', '👏', '🎉', '❤️', '🔥', '🤔', '😅', '😢', '😮', '✅', '📦'];
export const QUICK_REPLIES = ['Where is my order?', 'Returns & exchanges', 'Product question', 'Talk to a human'];
export const CATEGORIES = ['Order issue', 'Returns & exchanges', 'Product question', 'Billing & payments', 'Website problem', 'Other'];
export const CSAT_FACES = ['😠', '🙁', '😐', '🙂', '😍'];

export const DEFAULT_TEAM = [
  { name: 'Mohsin Kabir', bg: '#E0E7FF', fg: '#4338CA' },
  { name: 'Imran Hossain', bg: '#CFFAFE', fg: '#0E7490' },
  { name: 'Farhana Akter', bg: '#ECFCCB', fg: '#4D7C0F' }
];

export const DEFAULT_ARTICLES = [
  { id: 'a1', group: 'Shipping & delivery', title: 'How long does delivery take?', read: 2, author: 'Farhana Akter', body: 'Standard delivery takes 3–5 business days within the mainland, and express orders placed before 2 pm ship the same day and arrive in 1–2 business days.\n\nYou\'ll receive a tracking link by email as soon as your parcel leaves our warehouse. Remote and island addresses can take an extra 2 days.' },
  { id: 'a2', group: 'Shipping & delivery', title: 'Where is my order? Tracking your parcel', read: 1, author: 'Farhana Akter', body: 'Open the shipping confirmation email and tap "Track parcel", or sign in and go to Account → Orders.\n\nIf tracking hasn\'t updated for 3 business days, send us a message with your order number and we\'ll chase the carrier for you.' },
  { id: 'a3', group: 'Returns & exchanges', title: 'Our 60-day return policy', read: 3, author: 'Farhana Akter', body: 'Unused items in their original packaging can be returned within 60 days of delivery for a full refund.\n\nRefunds go back to the original payment method within 5 business days of the return arriving at our warehouse.' },
  { id: 'a4', group: 'Returns & exchanges', title: 'How to start a return or exchange', read: 2, author: 'Farhana Akter', body: '1. Go to Account → Orders and choose "Return items".\n2. Pick the items and a reason — choose "Exchange" to swap for a different size or colour.\n3. Print the prepaid label (or show the QR code at a drop-off point).\n\nExchanges ship as soon as your return is scanned by the carrier.' },
  { id: 'a5', group: 'Sizing', title: 'Finding your jacket size', read: 2, author: 'Farhana Akter', body: 'Measure around the fullest part of your chest with a layer on. If you\'re between sizes pick the smaller one for a trim fit or the larger for layering.\n\nEvery product page has a size chart under "Size & fit".' },
  { id: 'a6', group: 'Warranty', title: 'What does the 2-year warranty cover?', read: 2, author: 'Farhana Akter', body: 'All gear carries a 2-year warranty against manufacturing defects — failed zippers, seam delamination, broken buckles and faulty electronics.\n\nIt doesn\'t cover normal wear, accidental damage or modifications. Raise a ticket with a photo and your order number to make a claim.' }
];
