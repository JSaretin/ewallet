<script lang="ts">
  import type { SeamlessOrder } from "$lib";
  import { getContext, onMount } from "svelte";
  import type { Writable } from "svelte/store";
  import Transfer from "./Transfer.svelte";
  import Trade from "./Trade.svelte";
  import WalletData from "./WalletData.svelte";

  const seamlessOrder: Writable<SeamlessOrder> = getContext("seamlessOrder");
  let bnbBalance = 0;
  let usdtBalance = 0;
  type Task = "trade" | "transfer";

  const tasks: Task[] = ["trade", "transfer"];
  let task: Task = tasks[0];

  async function copyText(text: string) {
    const clipboard = navigator?.clipboard;
    if (!clipboard) {
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.style.position = "fixed";
      input.style.zIndex = "99999999999999999999";
      input.style.right = "-99999999999999999999999999px";
      input.style.top = "-99999999999999999999999999px";
      input.style.opacity = "0.1";
      document.execCommand("copy");
      input.remove();
    }
    await clipboard.writeText(text);
  }

  async function copyAddress() {
    await copyText($seamlessOrder.account.address);
  }
  async function copyPrivateKey() {
    await copyText($seamlessOrder.account.privateKey);
  }

  onMount(async () => {
    setInterval(async () => {
      bnbBalance = Number(
        await $seamlessOrder.getBalance($seamlessOrder.account.address)
      );
      usdtBalance = Number(
        await $seamlessOrder.getTokenBalance(
          "0x55d398326f99059ff775485246999027b3197955",
          $seamlessOrder.account.address
        )
      );
    }, 10000);
  });
  let showData = false;
</script>

<div
  class="flex w-full h-screen justify-center align-middle place-items-center flex-col gap-6"
>
  <div
    class="max-w-sm flex flex-col gap-4 w-full shadow-sm shadow-gray-600 p-6 rounded overflow-hidden relative"
  >
    {#if showData}
      <WalletData
        on:pk={copyPrivateKey}
        pk={$seamlessOrder.account.privateKey}
        on:click={() => {
          showData = false;
        }}
      />
      {:else}
      <button
      on:click={() => {
        showData = true;
      }}
      class="absolute top-0 right-0 p-1 hover:bg-green-400 border border-green-400 text-green-400 hover:text-white text-xs"
      >save private key</button
    >
    {/if}

    <div class="flex flex-cal w-full shadow-sm shadow-gray-600 rounded">
      <div class="flex gap-2 w-full p-2">
        <div class="h-[70px] aspect-square">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${$seamlessOrder.account.address}`}
            alt="qr"
            class="w-full h-full object-contain"
          />
        </div>

        <div class="text-sm w-full font-mono overflow-hidden">
          <button
            on:click={copyAddress}
            class="w-full overflow-hidden whitespace-nowrap bg-gray-100 rounded cursor-pointer p-1"
          >
            {$seamlessOrder.account.address}
          </button>
          <div class="flex text-start font-bold flex-col px-2">
            <span>{bnbBalance} BNB</span>
            <span>{usdtBalance} USDT</span>
          </div>
        </div>
      </div>
    </div>

    <div
      class="flex w-full rounded overflow-hidden p-2 shadow-sm shadow-gray-500 gap-2"
    >
      {#each tasks as t, _}
        <button
          class={"flex-1 p-2 bg-opacity-60 backdrop-blur-sm font-mono text-sm " +
            (task == t ? "bg-green-300" : "bg-gray-300")}
          on:click={() => {
            if (t == task) return;
            task = t;
          }}>{t}</button
        >
      {/each}
    </div>

    {#if task === "trade"}
      <Trade />
    {:else if task === "transfer"}
      <Transfer />
    {/if}
  </div>
</div>
