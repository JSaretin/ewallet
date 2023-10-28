<script lang="ts">
  import { createEventDispatcher } from "svelte";
  export let pk: string;
  const emiter = createEventDispatcher();
  function reload(){
  window.location.reload();

  }
  function deleteWallet() {
    delete localStorage["pkKey"];
    reload();
  }
</script>

<div class="absolute inset-0 bg-black bg-opacity-70 z-50 backdrop-blur-sm">
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="w-full h-full justify-center align-middle place-items-center flex relative" on:click|self on:keyup
  >
    <button
      on:click={deleteWallet}
      class="absolute top-0 left-0 p-2 hover:bg-red-400 border border-red-400 text-red-400 hover:text-gray-900 text-xs"
      >delete wallet</button
    >
    <div class="flex flex-col gap-4 shadow-sm shadow-white p-4 rounded-2xl">
      <div class="h-[70px] aspect-square">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${pk}`}
          alt="qr"
          class="w-full h-full object-contain"
        />
      </div>
      <button
        on:click={() => {
          emiter("pk");
        }}
        class="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm"
        >Copy Private Key</button
      >
    </div>
  </div>
</div>
