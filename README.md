# todo-nextjs

A Replicache sample using Next.js/serverless/Supabase.

Also demonstrates:

- Global Version Strategy
- [Shared Mutators](https://doc.replicache.dev/howto/share-mutators)
- [Poke](https://doc.replicache.dev/byob/poke) via Supabase realtime notifications

Running live at https://replicache-todo-nextjs.vercel.app/

# Setup

<ol>
 <li>Create a new project at supabase.com. <b>Take note of the database password when you setup.</b></li>
 <li>Set the following environment variables:
   <ul>
     <li><code>NEXT_PUBLIC_SUPABASE_URL</code>: The "project URL" from the supabase project's dashboard. Looks like <code>https://&lt;id&gt;.supabase.co</code>, where `id` is the project's unique ID.</li>
     <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>: The "API Key" from the supabase project. Accessible on project dashboard.</li>
          <li><code>SUPABASE_DATABASE_URL</code>: The database URL (e.g. <code>postgresql://postgres.yourprojectid:yourpassword@aws-0-us-west-1.pooler.supabase.com:6543/postgres</code>)
          </li>
               <li><code>NEXT_PUBLIC_REPLICACHE_LICENSE_KEY</code>: Your Replicache license key</li>
    </ul>
  </li>
  <li><code>npm run dev</code></li>
</ol>
