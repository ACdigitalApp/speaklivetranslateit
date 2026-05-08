revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.current_admin_profile_id() from public, anon, authenticated;
revoke execute on function public.get_all_users_for_admin() from public, anon, authenticated;
revoke execute on function public.admin_update_profile(uuid, text, text, text, text, boolean, text, text, text, timestamptz, numeric, numeric) from public, anon, authenticated;
revoke execute on function public.update_user_role(uuid, text) from public, anon, authenticated;
revoke execute on function public.remove_user(uuid) from public, anon, authenticated;
revoke execute on function public.delete_user(uuid) from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;