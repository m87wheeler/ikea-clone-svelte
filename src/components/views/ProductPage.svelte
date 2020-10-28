<script>
  import Rule from "../atoms/Rule.svelte";
  import Section from "../atoms/Section.svelte";
  import Slideshow from "../organisms/Slideshow.svelte";
  import Breadcrumb from "../ProductPage/Breadcrumb.svelte";
  import News from "../atoms/News.svelte";
  import Family from "../atoms/Family.svelte";
  import Title from "../atoms/Title.svelte";
  import Price from "../atoms/Price.svelte";
  import Info from "../../svg/Info.svelte";
  import Button from "../atoms/Button.svelte";
  import Truck from "../../svg/Truck.svelte";
  import Store from "../../svg/Store.svelte";
  import Link from "../atoms/Link.svelte";
  import Returns from "../../svg/Returns.svelte";

  import { products } from "./productData";
  import { formatPrice, formatArtNo } from "../../assets/functions";
  import ToggleArrow from "../../svg/ToggleArrow.svelte";
  import StatusDot from "../atoms/StatusDot.svelte";

  export let artNumber;
  const prod = products.find((product) => product.artno === artNumber);
  console.log(prod);
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .product {
    &__info {
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
    }

    p {
      font-size: 0.75rem;
      line-height: 1.5;
      color: $color-gray-700;
    }

    &__important {
      margin: 2.5rem 0;
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: flex-start;

      p {
        margin-left: 0.25rem;
      }
    }

    &__wishlist {
      text-align: center;
    }

    &__availability {
      font-size: 0.875rem;
      line-height: 1.71429;
      color: $color-gray-700;

      .product-grid {
        display: grid;
        column-gap: 0.5rem;
        align-items: center;
        justify-content: flex-start;

        &--ltr {
          grid-template-columns: 1.5rem auto auto;
        }

        &--rtl {
          grid-template-columns: 1fr 1.5rem;
        }
      }
    }

    &__artno {
      height: 6rem;
      display: flex;
      align-items: center;

      p {
        padding: 0.0625rem 0.625rem;
        font-size: 0.75rem;
        line-height: 1.5;
        font-weight: 700;
        color: $color-gray-900;
        background: $color-gray-100;
      }
    }
  }
</style>

<Section>
  <Breadcrumb parent={prod.breadcrumb[0]} grandparent={prod.breadcrumb[1]} />
  <Rule />
  <Slideshow data={prod.images} imageOnly max={prod.images.length} step={1} />

  <div class="product">
    {#if prod.promotional.news}
      <News />
    {/if}
    {#if prod.promotional.family}
      <Family />
    {/if}
    <div class="product__info">
      <Title>{prod.name}</Title>
      <Price price={prod.price.current} />
    </div>
    <p>{prod.type}, {prod.description} {prod.color}, {prod.dimensions}</p>
    {#if prod.price.previous}
      <p>Regular price {formatPrice(prod.price.previous, 'str')}</p>
    {/if}
    {#if prod.promotional.valid_from && prod.promotional.valid_to}
      <p>
        Price valid
        {prod.promotional.valid_from}
        -
        {prod.promotional.valid_to}
        or while supply lasts
      </p>
    {/if}
    {#if prod.additional}
      <div class="product__important">
        <Info style="width: 1rem; filter: contrast(.5);" />
        <p>{prod.additional}</p>
      </div>
    {/if}
    <div class="product__wishlist">
      <Button>Add To Wishlist</Button>
    </div>
  </div>
</Section>
<Section>
  <div class="product__availability">
    <p class="product-grid product-grid--ltr">
      <Truck />
      {#if prod.availability.online > 0}
        Available online
        <StatusDot available />
      {:else}
        Currently unavailable online
        <StatusDot />
      {/if}
    </p>
    <Rule />
    <p class="product-grid product-grid--ltr">
      <Store />
      <Link>Check in-store stock</Link>
    </p>
    <Rule />
    <p class="product-grid product-grid--ltr">
      <Returns />
      You have 365 days to change your mind.
    </p>
    <Rule />
    <div class="product__artno">
      <p>{formatArtNo(prod.artno)}</p>
    </div>
    <Rule />
    <p class="product-grid product-grid--rtl">
      <Link>Product details</Link>
      <ToggleArrow style="filter: invert(1); transform: rotate(-90deg);" />
    </p>
    <Rule />
    <p class="product-grid product-grid--rtl">
      <span><Link style="display: block;">
          <p>Product size</p>
        </Link>
        {prod.dimensions}</span>
      <ToggleArrow style="filter: invert(1); transform: rotate(-90deg);" />
    </p>
    <Rule />
  </div>
</Section>
