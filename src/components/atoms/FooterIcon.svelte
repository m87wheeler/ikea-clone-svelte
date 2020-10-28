<script>
  let visa = "images/icons/visa.svg";
  let mastercard = "images/icons/mastercard.svg";
  let amex = "images/icons/amex.svg";
  let maestro = "images/icons/maestro.svg";
  let paypal = "images/icons/paypal.svg";
  let ppcredit = "images/icons/paypal_credit.svg";
  let giftcard = "images/icons/giftcard.svg";
  import Facebook from "../../svg/Facebook.svelte";
  import Instagram from "../../svg/Instagram.svelte";
  import Pinterest from "../../svg/Pinterest.svelte";
  import Twitter from "../../svg/Twitter.svelte";
  import Youtube from "../../svg/Youtube.svelte";

  export let icon = "facebook";
  export let round;
  export let square;
  export let style;
  export let ref;
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .icon {
    display: inline-flex;
    align-items: center;
    justify-items: center;
    padding: 0;
    border: 1px solid $color-gray-200;
    text-align: center;
    background: transparent;
    color: $color-gray-900;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
      border: 1px solid $color-gray-700;
    }

    &__wrapper {
      display: inherit;
      align-items: inherit;
      justify-items: inherit;
    }

    &--round {
      padding: 0.5rem;
      border-radius: 100%;
      margin-right: 0.4rem;

      .icon__wrapper {
        filter: contrast(0.45);
      }
    }

    &--square {
      img {
        height: 2rem;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
      }
    }
  }
</style>

<div {style} {ref} class={`icon ${square ? 'icon--square' : 'icon--round'}`}>
  <span class="icon__wrapper">
    {#if icon === 'facebook'}
      <Facebook />
    {:else if icon === 'twitter'}
      <Twitter />
    {:else if icon === 'pinterest'}
      <Pinterest />
    {:else if icon === 'instagram'}
      <Instagram />
    {:else if icon === 'youtube'}
      <Youtube />
    {:else if icon === 'visa'}
      <img src={visa} alt="payment icon" class="payment-icon" />
    {:else if icon === 'mastercard'}
      <img src={mastercard} alt="payment icon" class="payment-icon" />
    {:else if icon === 'amex'}
      <img src={amex} alt="payment icon" class="payment-icon" />
    {:else if icon === 'maestro'}
      <img src={maestro} alt="payment icon" class="payment-icon" />
    {:else if icon === 'paypal'}
      <img src={paypal} alt="payment icon" class="payment-icon" />
    {:else if icon === 'ppcredit'}
      <img src={ppcredit} alt="payment icon" class="payment-icon" />
    {:else if icon === 'giftcard'}
      <img src={giftcard} alt="payment icon" class="payment-icon" />
    {/if}
  </span>
</div>
