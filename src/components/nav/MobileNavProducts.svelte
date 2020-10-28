<script>
  import Title from "../atoms/Title.svelte";

  let src = "/images/photos/fabrikoer-glass-door-cabinet.webp";
  let unhide = false;
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .container {
    height: 100%;
    max-width: 100vw;
    width: 100%;
    padding: 1rem;
    display: flex;
    flex-flow: column nowrap;
    overflow-x: hidden;
    overflow-y: scroll;
  }

  ul {
    list-style-type: none;
    margin-bottom: 1.375rem;

    &:first-of-type {
      li {
        a {
          font-weight: 700;
        }
      }
    }

    &:last-of-type {
      margin-bottom: 5.5rem;
    }

    li {
      padding: 0.375rem 1.25rem 0.375rem 0;
      font-size: 0.875rem;
      line-height: 1.71429;

      a {
        text-decoration: none;
        color: $color-gray-900;

        &:hover {
          text-decoration: underline;
          cursor: pointer;
        }
      }
    }

    .hidden {
      display: none;
    }
  }

  .recent {
    p {
      font-size: 0.875rem;
      font-weight: 700;
    }
    &__images {
      display: flex;
      flex-flow: row nowrap;

      img {
        width: 5rem;
        padding: 2rem 1rem 0 0;
      }
    }
  }
</style>

<Title type="h2" style="padding-left: 1rem;">Products</Title>
<div class="container">
  <ul>
    <li><a href="/">New Products</a></li>
    <li><a href="/">New Lower Price</a></li>
    <li><a href="/">Everyday Essentials</a></li>
  </ul>
  <ul>
    <li><a href="/">Christmas</a></li>
    <li><a href="/">Decoration</a></li>
    <li><a href="/">Furniture</a></li>
    <li><a href="/">Cookware & tableware</a></li>
    <li><a href="/">Storage & organisation</a></li>
    <li><a href="/">Kitchen & appliances</a></li>
    <li><a href="/">Home furnishing & accessories</a></li>
    <li><a href="/">Lighting</a></li>
    <li><a href="/">Textiles</a></li>
    <li><a href="/">Rugs, mats & flooring</a></li>
    <li><a href="/">Beds & mattresses</a></li>
    <li><a href="/">Plants & plant pots</a></li>
    <li
      class={`${!unhide ? 'show-more' : 'hidden'}`}
      style="text-decoration: underline;"
      on:click={() => (unhide = true)}>
      More
    </li>
    <li class={`${!unhide && 'hidden'}`}><a href="/">Baby & children</a></li>
    <li class={`${!unhide && 'hidden'}`}><a href="/">Bathroom products</a></li>
    <li class={`${!unhide && 'hidden'}`}><a href="/">Home electronics</a></li>
    <li class={`${!unhide && 'hidden'}`}><a href="/">Home Smart</a></li>
    <li class={`${!unhide && 'hidden'}`}><a href="/">Outdoor products</a></li>
    <li class={`${!unhide && 'hidden'}`}><a href="/">Summer</a></li>
    <li class={`${!unhide && 'hidden'}`}><a href="/">Laundry & cleaning</a></li>
    <li class={`${!unhide && 'hidden'}`}><a href="/">Home improvement</a></li>
    <li class={`${!unhide && 'hidden'}`}><a href="/">Safety products</a></li>
    <li class={`${!unhide && 'hidden'}`}><a href="/">Leisure & travel</a></li>
    <li class={`${!unhide && 'hidden'}`}><a href="/">Food & beverages</a></li>
  </ul>
  <div class="recent">
    <p>Recently Viewed</p>
    <div class="recent__images"><img {src} alt="recent product" /></div>
  </div>
</div>
