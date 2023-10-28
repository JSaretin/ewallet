<script lang="ts">
  import type { SeamlessOrder } from "$lib";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";

  const seamlessOrder: Writable<SeamlessOrder> = getContext("seamlessOrder");

  let input: number = 0;
  let result: number = 0;
  let toBnb = false;
  let inTrade = false;
  let advance = false;

  let address = $seamlessOrder.account.address;

  const secondaryToken = "0x55d398326f99059ff775485246999027b3197955";

  async function calculateReward() {
    result = 0;
    if (!input || input <= 0) {
      return;
    }
    const path = [
      await $seamlessOrder.dexRouter.methods.WETH().call(),
      secondaryToken,
    ];
    if (toBnb) {
      path.reverse();
    }
    const res = await $seamlessOrder.estimateReturnReward(
      path[0],
      path[1],
      Number(input)
    );

    if (!res) return;
    result = res;
  }

  async function trade() {
    if (inTrade) return;
    if (!input || input <= 0) {
      return;
    }
    inTrade = true;
    const addr = advance ? address : $seamlessOrder.account.address;
    if (!toBnb) {
      await $seamlessOrder.buyTokenWithCoin(secondaryToken, addr, input);
    } else {
      await $seamlessOrder.sellTokenToBnb(secondaryToken, addr, input);
    }
    inTrade = false;
  }
</script>

<div class="w-full relative">
  <button
    on:click={async () => {
      toBnb = !toBnb;
      await calculateReward();
    }}
    class={"px-2 text-sm text-white rounded-tr absolute top-0 right-0 " +
      (toBnb ? "bg-green-500" : "bg-gray-500")}
  >
    to bnb
    <!-- <input type="checkbox" bind:checked={toBnb} on:change={calculateReward} /> -->
  </button>

  <button
    on:click={() => {
      advance = !advance;
    }}
    class={"px-2 text-sm text-white rounded-tl absolute top-0 left-0 " +
      (advance ? "bg-green-500" : "bg-gray-500")}
  >
    add address
    <!-- <input type="checkbox" bind:checked={toBnb} on:change={calculateReward} /> -->
  </button>
  <div
    class="flex rounded shadow-gray-600 flex-col p-4 rouded gap-2 shadow-sm w-full"
  >
    <label class="flex flex-col">
      Amount
      <input
        type="number"
        bind:value={input}
        on:input={calculateReward}
        class="bg-gray-300 text-gray-900 font-medium font-mono p-1 rounded"
      />
    </label>
    {#if advance}
      <label class="">
        Address
        <input
          class="bg-gray-200 w-full p-1 rounded font-mono text-sm"
          type="text"
          bind:value={address}
        />
      </label>
    {/if}
    {#if toBnb}
      <p class="text-sm p-2 text-gray-500">
        {(input || 0).toFixed(5)} USDT = {Number(result).toFixed(5)} BNB
      </p>
    {:else}
      <p class="text-sm p-2 text-gray-500">
        {(input || 0).toFixed(5)} BNB = {Number(result).toFixed(5)} USDT
      </p>
    {/if}
    <button
      class="bg-blue-400 text-white p-2 rounded"
      on:click={trade}
      disabled={inTrade}
    >
      {#if inTrade}
        swapping...
      {:else}
        swap
      {/if}
    </button>
  </div>
</div>
