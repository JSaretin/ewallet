<script lang="ts">
  import type { FeedBack, SeamlessOrder } from "$lib";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";

  const seamlessOrder: Writable<SeamlessOrder> = getContext("seamlessOrder");
  const feedbacks: Writable<FeedBack[]> = getContext("feedbacks");

  let to: string;
  let amount: number;
  let sending = false;

  async function transfer() {
    if (!Boolean(amount)||(!Boolean(to) && sending)) return
    if (sending) return;
    sending = true;
    const transaction = await $seamlessOrder.withdrawCoin(amount, to);
    if (!transaction) {
      sending = false;
      return;
    }
    feedbacks.update((fds) => [
      { message: "transaction sent", type: "success" },
      ...fds,
    ]);
    sending = false;
  }
</script>

<div
  class="flex shadow-gray-600 flex-col gap-2 p-4 rouded shadow-sm max-w-sm w-full"
>
  <label class="flex flex-col">
    Amount
    <input
      bind:value={amount}
      type="text"
      class="bg-gray-300 text-gray-900 font-medium font-mono p-1 rounded"
    />
  </label>
  <label class="flex flex-col">
    Receiver
    <input
      type="text"
      bind:value={to}
      class="bg-gray-300 text-gray-900 font-medium font-mono p-1 rounded"
      placeholder="0x00000000000000"
    />
  </label>

  <button
    class="bg-blue-400 mt-2 text-white p-2 rounded"
    on:click={transfer}
    disabled={sending}
  >
    {#if sending}
      sending....
    {:else}
      send
    {/if}
  </button>
</div>
