<script>
  import ToggleArrow from "../../svg/ToggleArrow.svelte";

  export let grandparent;
  export let parent;
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  ol {
    display: flex;
    flex-flow: row nowrap;
    width: 100%;
    list-style-type: none;
    line-height: 1.5;
    font-size: 0.75rem;

    .icon {
      display: flex;
      align-items: center;
      justify-items: flex-end;
      width: 0.75rem;
      height: 0.75rem;
      margin: 0.2rem 0.25rem 0;
      filter: invert(1);
      transform: rotate(-90deg);
    }

    li {
      a {
        color: $color-gray-900;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
</style>

<ol>
  <li><a href="/">{grandparent}</a></li>
  <li class="icon">
    <ToggleArrow style="width: .75rem;" />
  </li>
  <li><a href="/">{parent}</a></li>
</ol>
