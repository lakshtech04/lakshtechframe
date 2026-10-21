/* Optional browser-side Supabase helpers for the frame editor.
 * Load Supabase JS v2 before this file, then call window.FrameBackend.*
 * Never place a service-role key in frontend code.
 */
(function () {
  const config = window.LAKHTECH_CONFIG;
  if (!config || !window.supabase) {
    console.warn('FrameBackend: load supabase-config.js and Supabase JS v2 first.');
    return;
  }
  const client = window.supabase.createClient(config.url, config.anonKey);

  async function requireUser() {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Please sign in first.');
    return data.user;
  }

  window.FrameBackend = {
    client,
    async signUp(email, password, displayName = '') {
      const { data, error } = await client.auth.signUp({
        email, password, options: { data: { display_name: displayName } }
      });
      if (error) throw error;
      return data;
    },
    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
    async listTemplates(category = null) {
      let query = client.from('frame_templates').select('*').eq('is_active', true).order('created_at', { ascending: false });
      if (category) query = query.eq('category', category);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async saveDesign({ id = null, templateId = null, title = 'My Design', designJson = {} }) {
      const user = await requireUser();
      const row = { user_id: user.id, template_id: templateId, title, design_json: designJson, updated_at: new Date().toISOString() };
      const query = id
        ? client.from('user_frame_designs').update(row).eq('id', id).select().single()
        : client.from('user_frame_designs').insert(row).select().single();
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async listMyDesigns() {
      await requireUser();
      const { data, error } = await client.from('user_frame_designs').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async deleteDesign(id) {
      await requireUser();
      const { error } = await client.from('user_frame_designs').delete().eq('id', id);
      if (error) throw error;
    },
    async uploadExport(blob, filename = 'design.png') {
      const user = await requireUser();
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
      const { data, error } = await client.storage.from('user-design-exports').upload(path, blob, { upsert: false, contentType: blob.type || 'image/png' });
      if (error) throw error;
      return data.path;
    }
  };
})();
