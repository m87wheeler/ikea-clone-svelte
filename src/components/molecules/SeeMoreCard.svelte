<script>
  import Card from "../atoms/Card.svelte";
  import StandardArrow from "../../svg/StadardArrow.svelte";
  import Link from "../atoms/Link.svelte";

  export let style;
  export let href = "/";
</script>

<style type="text/scss">
  .text {
    margin-bottom: 0.75rem;
  }
  .icon {
    height: 1.5rem;
  }
</style>

<Card {style}>
  <Link {href}>
    <div class="text">
      <slot />
    </div>
    <div class="icon">
      <StandardArrow />
    </div>
  </Link>
</Card>
