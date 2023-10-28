<script lang="ts">
  import "../app.css";
  import { SeamlessOrder, type FeedBack } from "$lib";
  import { HDNodeWallet } from "ethers";
  import { onMount, setContext } from "svelte";
  import { web3, defaultEvmStores } from "svelte-web3";
  import { writable, type Writable } from "svelte/store";

  let loaded: boolean;
  const feedbacks: Writable<FeedBack[]> = writable([]);
  const seamlessOrder: Writable<SeamlessOrder> = writable();


  setContext("seamlessOrder", seamlessOrder);
  setContext("feedbacks", feedbacks);


  onMount(async () => {
    const privateKey =
      localStorage.getItem("pkKey") || HDNodeWallet.createRandom().privateKey;
    localStorage.setItem("pkKey", privateKey);

    await defaultEvmStores.setProvider("https://bsc-dataseed.binance.org/");
    $seamlessOrder = new SeamlessOrder(privateKey, $web3, feedbacks);
    loaded = true;
  });

  const feedbackClass: { [key: string]: string } = {
    error: "bg-red-300",
    success: "bg-green-300",
    danger: "bg-red-600",
  };
</script>

{#if $feedbacks.length > 0}
  <div
    class="fixed right-0 top-0 flex-col text-xs p-6 flex gap-2 max-w-[300px] w-full z-50"
  >
    {#each $feedbacks as feedback, index}
      <p
        class={"p-2 rounded text-center w-full break-words overflow-clip " +
          (feedbackClass[feedback.type] || "")}
      >
        {feedback.message}
      </p>
    {/each}
  </div>
{/if}
{#if !loaded}
  loading...
{:else}
  <slot />
{/if}
