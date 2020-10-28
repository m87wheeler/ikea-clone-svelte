<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  import Card from "../atoms/Card.svelte";
  import Family from "../atoms/Family.svelte";
  import Icon from "../atoms/Icon.svelte";
  import News from "../atoms/News.svelte";
  import Price from "../atoms/Price.svelte";
  import Title from "../atoms/Title.svelte";

  export let news = false;
  export let family = false;
  export let href = "";
  export let artno;
  export let title = "";
  export let productType = "";
  export let regularPrice = 0;
  export let price = 0;
  export let pieces = 0;
  export let style = "";

  const viewProduct = () => {
    dispatch("productview", {
      artno,
    });
  };
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .info {
    display: grid;
    grid-template-columns: 1fr auto;
    cursor: pointer;

    &__promotional {
      grid-column: 1 / span 1;
    }

    &__icon {
      margin-top: -1rem;
      margin-right: -1rem;
      grid-column: 2 / span 1;
      justify-self: flex-end;
      height: 2.5rem;
      width: 2.5rem;
      transform: rotate(-90deg);
      filter: invert(1);
    }

    &__title,
    &__subtitle,
    &__reg-price,
    &__price {
      grid-column: 1 / span 2;
    }

    &__title {
      text-decoration: none;
      color: $color-gray-900;
    }

    &__subtitle,
    &__reg-price {
      color: $color-gray-700;
    }

    &__subtitle {
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
      margin-right: 2rem;
    }

    &__reg-price {
      font-size: 0.75rem;
    }

    &__price {
      font-size: 1rem;
      font-weight: 700;
      line-height: 1.875;

      span {
        font-size: 0.625rem;
      }
    }
  }
</style>

<Card shadow {style} on:click={viewProduct}>
  <div class="info">
    <div class="info__promotional">
      {#if news}
        <News />
      {/if}
      {#if family}
        <Family />
      {/if}
    </div>
    <div class="info__icon">
      <Icon icon="toggleArrow" hover={false} />
    </div>
    <a {href} class="info__title"><Title type="h4">{title}</Title></a>
    <p class="info__subtitle">{productType}</p>
    {#if regularPrice}
      <p class="info__reg-price">Regular price £{regularPrice}</p>
    {/if}
    <p class="info__price">
      <Price {price} />
      {#if pieces > 0}<span>/ {pieces} pieces</span>{/if}
    </p>
  </div>
</Card>
