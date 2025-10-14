import { supabaseServer } from '@/lib/supabaseServer';
import AddonCard from '@/components/addons/AddonCard';
export const dynamic='force-dynamic';
export default async function Marketplace(){
  const sb=supabaseServer();
  const [{data:addons},{data:{user}={user:null}}]=await Promise.all([
    sb.from('addons').select('*').order('sort_order'),
    sb.auth.getUser()
  ]);
  let owned:Record<string,string>={};
  if(user){const {data:ua}=await sb.from('user_addons').select('*').eq('user_id',user.id); ua?.forEach(a=>owned[a.addon_id]=a.status);}
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="h-title text-3xl">Add-Ons Marketplace</h1>
      <p className="mt-2 p-sub">Power up XRglass Pro with premium modules. 7-day trials included.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {addons?.map((a:any)=>(<AddonCard key={a.id} addon={a} userId={user?.id??null} status={owned[a.id]} />))}
      </div>
    </div>
  );
}
