'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToastResult } from '@/lib/useToastNotice';
export default function ProfilePhoto({ imageUrl, name }: { imageUrl?: string | null; name:string }) {
  const router = useRouter();
  const [photo, setPhoto] = useState(imageUrl);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useToastResult();
  async function upload(file?: File) {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 2*1024*1024) { setNotice({tone:'error',text:'Choose a JPEG, PNG or WebP photo, no larger than 2 MB.'}); return; }
    setBusy(true); setProgress(0); setNotice(null);
    try {
      const result = await new Promise<{imageUrl:string;message:string}>((resolve,reject) => {
        const xhr = new XMLHttpRequest(); xhr.open('POST','/api/account/profile/image'); xhr.timeout=45000;
        xhr.setRequestHeader('Content-Type',file.type);
        xhr.upload.onprogress = event => { if(event.lengthComputable) setProgress(Math.round(event.loaded/event.total*100)); };
        xhr.onerror=()=>reject(new Error('Check your connection and try again.'));
        xhr.ontimeout=()=>reject(new Error('Upload timed out. Refresh to check whether your photo was saved before trying again.'));
        xhr.onload=()=>{try{const body=JSON.parse(xhr.responseText);if(xhr.status>=200&&xhr.status<300)resolve(body);else reject(new Error(body.message||'Upload failed.'));}catch{reject(new Error('Upload failed. Please try again.'));}};
        xhr.send(file);
      });
      setPhoto(result.imageUrl); setNotice({tone:'success',text:result.message}); router.refresh();
    } catch(error) { setNotice({tone:'error',text:(error as Error).message}); } finally {setBusy(false);}
  }
  async function remove() {
    setBusy(true);setNotice(null);
    try {const response=await fetch('/api/account/profile/image',{method:'DELETE'});const body=await response.json();if(!response.ok)throw new Error(body.message);setPhoto(null);setNotice({tone:'success',text:body.message});router.refresh();}
    catch(error){setNotice({tone:'error',text:error instanceof Error?error.message:'Unable to remove photo.'});}finally{setBusy(false);}
  }
  return <div className="settings-profile-photo">
    <div className="settings-photo-preview">{photo?<img src={photo} alt={`${name} profile`} />:<span>{name.split(' ').map(p=>p[0]).slice(0,2).join('')}</span>}</div>
    <div><strong>Profile photo</strong><p>JPEG, PNG or WebP, up to 2 MB. Your photo is resized to fit.</p>
      <div className="settings-photo-actions"><label className="button button-secondary">{busy?'Uploading…':'Upload photo'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event=>{void upload(event.target.files?.[0]);event.target.value='';}} /></label>{photo?<button className="button button-secondary" type="button" disabled={busy} onClick={remove}>Remove photo</button>:null}</div>
      {busy?<p role="status">{progress===100?'Processing and saving your photo…':`Uploading photo: ${progress}%`}<progress max={100} value={progress} aria-label="Photo upload progress" /></p>:null}
      {notice?<p role="status" className={notice.tone==='error'?'settings-feedback is-error':'settings-feedback'}>{notice.text}</p>:null}
    </div>
  </div>;
}
