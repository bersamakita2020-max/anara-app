-- Ganti nomor WhatsApp resmi yang sudah tersimpan.
-- Tampilan 0858-1169-9699. Tautan wa.me/6285811699699.

update public.app_settings
set payload = jsonb_set(
  jsonb_set(payload, '{waDisplay}', to_jsonb('0858-1169-9699'::text), true),
  '{waLink}', to_jsonb('https://wa.me/6285811699699'::text), true
)
where id = 1
  and (
    payload ->> 'waDisplay' is distinct from '0858-1169-9699'
    or payload ->> 'waLink' is distinct from 'https://wa.me/6285811699699'
  );

update public.contract_templates
set body = replace(
  replace(
    replace(body, 'wa.me/625811699699', 'wa.me/6285811699699'),
    '0581-1699-699', '0858-1169-9699'
  ),
  '05811699699', '085811699699'
)
where body like '%0581-1699-699%'
   or body like '%625811699699%'
   or body like '%05811699699%';

update public.contract_templates
set body = replace(body, '{{nomor}}n (depan Gereja Immanuel)', E'{{nomor}}\nJl. AIPDA KS. Tubun (depan Gereja Immanuel)')
where body like '%{{nomor}}n (depan Gereja Immanuel)%';

update public.workers
set whatsapp = '085811699699'
where whatsapp in ('05811699699', '0581-1699-699', '625811699699', '6285811699699')
  and name in ('M. Wilda Alfiansyah, A.Md.Kes.', 'M. Fadilah Alkadri');
