import { revalidatePath } from 'next/cache';

/** بعد از هر تغییر محتوا در پنل، کش صفحات عمومی را فوری تازه کن */
export function revalidateContent() {
  revalidatePath('/', 'layout');
}
