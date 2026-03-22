create unique index if not exists payments_provider_ref_idx
on payments(provider_reference_id)
where provider_reference_id is not null;