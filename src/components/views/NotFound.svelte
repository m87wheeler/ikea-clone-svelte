<script>
  import Section from "../atoms/Section.svelte";
  import Title from "../atoms/Title.svelte";

  let src = "/videos/404.mp4";
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .container {
    text-align: center;
  }

  .video {
    display: block;
    margin: 0 auto 3rem;

    video {
      width: 90%;
      max-width: 20rem;
    }
  }

  p,
  button {
    font-size: 0.875rem;
    line-height: 1.71429;
    color: $color-gray-700;
    border: none;
    background: transparent;
  }

  p:first-of-type {
    margin-bottom: 0.625rem;
  }
</style>

<Section>
  <div class="container">
    <div class="video">
      <video
        autoplay="autoplay"
        loop="loop"
        muted="muted"
        playsinline="playsinline">
        <source {src} type="video/mp4" />
      </video>
    </div>
    <Title>Oops! Something went wrong :(</Title>
    <p>The page you are looking for can't be found.</p>
    <p>Maybe the links below can be helpful.</p>
    <button>Go back to the IKEA homepage</button>
  </div>
</Section>
