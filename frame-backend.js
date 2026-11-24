/* Supabase-backed frame library. The browser key must be publishable/anon only. */
(function () {
  const config = window.LAKHTECH_CONFIG || {};
  const supabaseApi = window.supabase;
  const client = config.url && config.anonKey && supabaseApi && supabaseApi.createClient
    ? supabaseApi.createClient(config.url, config.anonKey)
    : null;
  const bucket = 'frame-templates';

  async function requireAdmin() {
    if (!client) throw new Error('Supabase is not configured.');
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Sign in with an administrator account.');
    const { data, error } = await client.from('frame_admins').select('user_id').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('This account does not have frame administrator access.');
    return user;
  }

  window.LakshtechFrameBackend = {
    ready: Boolean(client),
    client,
    async signIn(email, password) {
      if (!client) throw new Error('Supabase is not configured.');
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    async signUp(email, password, displayName) {
      if (!client) throw new Error('Supabase is not configured.');
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { display_name: displayName || '' } } });
      if (error) throw error;
      return data;
    },
    async signOut() {
      if (!client) return;
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
    async getSession() {
      if (!client) return null;
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    async isAdmin() {
      if (!client) return false;
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) return false;
      const { data, error } = await client.from('frame_admins').select('user_id').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    async listTemplates(includeInactive) {
      if (!client) return [];
      if (includeInactive) await requireAdmin();
      let query = client.from('frame_templates').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
      if (!includeInactive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    templateUrl(path) {
      if (!client || !path) return '';
      return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    },
    async uploadTemplate(file) {
      await requireAdmin();
      const allowed = ['image/png', 'image/webp', 'image/jpeg'];
      if (!file || !allowed.includes(file.type)) throw new Error('Use a PNG, WebP, or JPEG image.');
      if (file.size > 12 * 1024 * 1024) throw new Error('The frame image must be smaller than 12 MB.');
      const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = 'templates/' + crypto.randomUUID() + '.' + extension;
      const { data, error } = await client.storage.from(bucket).upload(path, file, {
        upsert: false,
        cacheControl: '60',
        contentType: file.type
      });
      if (error) throw error;
      return data.path;
    },
    async removeTemplateAsset(path) {
      await requireAdmin();
      if (!path) return;
      const { error } = await client.storage.from(bucket).remove([path]);
      if (error) throw error;
    },
    async saveTemplate(template) {
      await requireAdmin();
      const payload = {
        title: template.title,
        slug: template.slug,
        category: template.category,
        description: template.description || '',
        overlay_path: template.overlay_path,
        is_active: Boolean(template.is_active),
        sort_order: Number(template.sort_order) || 0,
        updated_at: new Date().toISOString()
      };
      const query = template.id
        ? client.from('frame_templates').update(payload).eq('id', template.id)
        : client.from('frame_templates').insert(payload);
      const { data, error } = await query.select('*').single();
      if (error) throw error;
      return data;
    },
    async setTemplateActive(id, isActive) {
      await requireAdmin();
      const { error } = await client.from('frame_templates').update({ is_active: Boolean(isActive), updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    subscribeTemplates(callback) {
      if (!client) return null;
      return client.channel('frame-template-gallery')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'frame_templates' }, callback)
        .subscribe();
    }
  };
})();
