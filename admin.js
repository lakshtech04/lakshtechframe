(function(){
 const api=window.LakshtechFrameBackend;
 const $=id=>document.getElementById(id);
 let editing=null, previewUrl=null;
 function note(message,isError){const el=$('notice');el.textContent=message;el.classList.add('show');el.style.background=isError?'#fff0ed':'#eef5e9';el.style.color=isError?'#9d361c':'#24563a'}
 function errorMessage(error){return error&&error.message?error.message:'कुछ गड़बड़ हुई। फिर कोशिश करें।'}
 function slugify(value){return String(value||'').toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'')||'frame'}
 function clearForm(){editing=null;$('templateForm').reset();$('templateId').value='';$('templateSlug').value='';$('sortOrder').value='0';$('active').checked=true;$('formHeading').textContent='नया फ्रेम जोड़ें';$('save').textContent='फ्रेम सेव करें';$('preview').src='';$('preview').classList.add('hidden');if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}}
 function showLogin(){ $('loginPanel').hidden=false;$('adminPanel').classList.add('hidden') }
 function safeCard(row){
  const card=document.createElement('article');card.className='template';
  const image=document.createElement('img');image.src=api.templateUrl(row.overlay_path);image.alt=row.title;image.loading='lazy';card.appendChild(image);
  const body=document.createElement('div');body.className='template-body';
  const badge=document.createElement('span');badge.className='badge'+(row.is_active?'':' off');badge.textContent=row.is_active?'सक्रिय':'छिपा हुआ';
  const title=document.createElement('h3');title.textContent=row.title;
  const desc=document.createElement('p');desc.textContent=(row.category||'')+(row.description?' · '+row.description:'');
  const order=document.createElement('p');order.textContent='गैलरी क्रम: '+(Number(row.sort_order)||0);
  const actions=document.createElement('div');actions.className='actions';
  const edit=document.createElement('button');edit.type='button';edit.className='btn secondary';edit.textContent='बदलें';edit.onclick=()=>editTemplate(row);
  const toggle=document.createElement('button');toggle.type='button';toggle.className='btn '+(row.is_active?'danger':'');toggle.textContent=row.is_active?'छिपाएँ':'सक्रिय करें';toggle.onclick=()=>toggleTemplate(row);
  actions.append(edit,toggle);body.append(badge,title,desc,order,actions);card.appendChild(body);return card
 }
 async function loadTemplates(){
  const rows=await api.listTemplates(true),root=$('templates');root.replaceChildren();
  if(!rows.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='अभी कोई बैकएंड फ्रेम नहीं है। पहला फ्रेम ऊपर से जोड़ें।';root.appendChild(empty);return}
  rows.forEach(row=>root.appendChild(safeCard(row)))
 }
 function editTemplate(row){
  editing=row;$('templateId').value=row.id;$('templateSlug').value=row.slug;$('title').value=row.title;$('category').value=row.category;$('description').value=row.description||'';$('sortOrder').value=Number(row.sort_order)||0;$('active').checked=Boolean(row.is_active);
  $('formHeading').textContent='फ्रेम बदलें';$('save').textContent='बदलाव सेव करें';$('preview').src=api.templateUrl(row.overlay_path);$('preview').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'})
 }
 $('loginForm').addEventListener('submit',async event=>{event.preventDefault();try{note('लॉगिन हो रहा है…');await api.signIn($('email').value.trim(),$('password').value);await initialize()}catch(error){note(errorMessage(error),true)}});
 $('signup').onclick=async()=>{try{if(!$('email').value.trim()||$('password').value.length<8){note('अकाउंट बनाने के लिए ईमेल और कम से कम 8 अक्षर का पासवर्ड भरें।',true);return}const data=await api.signUp($('email').value.trim(),$('password').value,'Frame Admin');note(data.session?'अकाउंट बन गया। अब Supabase में इस ईमेल को frame_admins में जोड़ें।':'अकाउंट बन गया। ईमेल confirmation के बाद लॉगिन करें, फिर admin अधिकार जोड़ें।')}catch(error){note(errorMessage(error),true)}};
 $('templateForm').addEventListener('submit',async event=>{
  event.preventDefault();$('save').disabled=true;let uploadedPath=null;
  try{
   const file=$('overlay').files[0];let overlayPath=editing?editing.overlay_path:'';
   if(file){uploadedPath=await api.uploadTemplate(file);overlayPath=uploadedPath}
   if(!overlayPath)throw new Error('फ्रेम इमेज अपलोड करें।');
   const title=$('title').value.trim();
   const record={id:editing?.id||null,title,slug:editing?.slug||slugify(title)+'-'+crypto.randomUUID().slice(0,8),category:$('category').value,description:$('description').value.trim(),overlay_path:overlayPath,is_active:$('active').checked,sort_order:$('sortOrder').value};
   await api.saveTemplate(record);
   if(uploadedPath&&editing&&editing.overlay_path&&editing.overlay_path!==uploadedPath){try{await api.removeTemplateAsset(editing.overlay_path)}catch(error){console.warn('Old frame asset was not removed:',error)}}
   clearForm();await loadTemplates();note('फ्रेम सेव हो गया। वेबसाइट की गैलरी लाइव अपडेट होगी।')
  }catch(error){if(uploadedPath){try{await api.removeTemplateAsset(uploadedPath)}catch{}}note(errorMessage(error),true)}
  finally{$('save').disabled=false}
 });
 async function toggleTemplate(row){try{await api.setTemplateActive(row.id,!row.is_active);await loadTemplates();note(row.is_active?'फ्रेम छिपा दिया गया।':'फ्रेम गैलरी में सक्रिय हो गया।')}catch(error){note(errorMessage(error),true)}}
 $('clear').onclick=clearForm;
 $('refresh').onclick=async()=>{try{await loadTemplates();note('फ्रेम सूची अपडेट हुई।')}catch(error){note(errorMessage(error),true)}};
 $('overlay').onchange=()=>{const file=$('overlay').files[0];if(!file)return;if(!['image/png','image/webp','image/jpeg'].includes(file.type)){note('PNG, WebP या JPEG फाइल चुनें।',true);$('overlay').value='';return}if(file.size>12*1024*1024){note('फाइल 12 MB से छोटी होनी चाहिए।',true);$('overlay').value='';return}if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);$('preview').src=previewUrl;$('preview').classList.remove('hidden')};
 $('logout').onclick=async()=>{try{await api.signOut();showLogin();note('लॉगआउट हो गया।')}catch(error){note(errorMessage(error),true)}};
 async function initialize(){
  if(!api||!api.ready){showLogin();note('Supabase configuration लोड नहीं हुआ। supabase-config.js और इंटरनेट connection जाँचें।',true);return}
  try{
   const session=await api.getSession();if(!session){showLogin();note('फ्रेम प्रबंधन के लिए व्यवस्थापक लॉगिन करें।');return}
   if(!await api.isAdmin()){showLogin();note('इस अकाउंट को admin अधिकार नहीं मिले हैं। Supabase SQL Editor में setup query चलाएँ।',true);return}
   $('loginPanel').hidden=true;$('adminPanel').classList.remove('hidden');note('व्यवस्थापक के रूप में जुड़े हैं।');
   await loadTemplates()
  }catch(error){showLogin();note(errorMessage(error),true)}
 }
 initialize();
})();
