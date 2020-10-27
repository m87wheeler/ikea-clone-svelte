<script>
  import Title from "../atoms/Title.svelte";
  import Section from "../atoms/Section.svelte";
  import Rule from "../atoms/Rule.svelte";
  import ImageCard from "../molecules/ImageCard.svelte";
  import Button from "../atoms/Button.svelte";
  import Card from "../atoms/Card.svelte";
  import SectionText from "../atoms/SectionText.svelte";
  import LargeProductCard from "../molecules/LargeProductCard.svelte";
  import Link from "../atoms/Link.svelte";
  import SeeMoreCard from "../molecules/SeeMoreCard.svelte";
  import ImageOverlay from "../molecules/ImageOverlay.svelte";
  import Slideshow from "../organisms/Slideshow.svelte";

  import { productData, slideShowData } from "./homepageData";
</script>

<style type="text/scss">
</style>

<Section>
  <Title>Make moments to treasure</Title>
  <ImageCard src="images/photos/festive-baking.jpg" left={10}>
    <SeeMoreCard style="position: absolute; bottom: 1rem; left: 1rem;">
      See more cookware & tableware
    </SeeMoreCard>
  </ImageCard>
  <Rule />
</Section>
<Section>
  <Card
    style="display: grid; grid-template-columns: 1fr auto; align-items: flex-start;">
    <Title>See our products in real homes <br /> @ikeauk</Title>
    <Button href="#">View more</Button>
  </Card>
  <p>Carousel goes here</p>
  <Rule />
</Section>
<Section>
  <Title type="h2">Illuminate your home with Christmas decorations</Title>
  <SectionText>
    From paper lampshades to fairy lights and colourful baubles, here’s
    everything you need to create a festive feel.
  </SectionText>
  <ImageCard src="images/photos/strala-lights.jpg">
    <ImageOverlay data={productData[0]} />
  </ImageCard>
  <ImageCard src="images/photos/christmas-decor.jpg">
    <ImageOverlay data={productData[1]} />
  </ImageCard>
  <Link style="display: grid; margin: 1.25rem 0 1rem 0;" icon>
    See all products for Christmas
  </Link>
  <Rule />
</Section>
<Section>
  <Title>New lower prices, same great quality</Title>
  <ImageCard src="images/photos/fabrikor-cabinets.webp" />
  <LargeProductCard
    title="FABRIKÖR Glass door cabinet"
    buttonText="Browse our new lower prices">
    <p
      style="
    margin-bottom: 0.625rem;
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1.7142;">
      Now £129
    </p>
    <p
      style="
  margin-bottom: 0.625rem;
  font-size: 0.875rem;
  line-height: 1.7142;">
      Was £150
    </p>
  </LargeProductCard>
</Section>
<Section>
  <Title type="h2">Quick guides to a more sustainable life at home</Title>
  <Slideshow type="images" data={slideShowData[0]} />
</Section>
<Section>
  <Title type="h2">More ideas and inspiration</Title>
  <Slideshow type="buttons" data={slideShowData[1]} noSlider showMax={2} />
  <p>Picture gallery goes here</p>
  <Button>Load 12 more</Button>
  <Rule />
</Section>
<Section>
  <Title>Important information</Title>
  <Button>See the latest updates</Button>
  <p>Covid Statement</p>
  <Button>Creating safer homes together</Button>
  <p>Secure it! Statement</p>
  <Button>
    IKEA recalls TROLIGTVIS travel mug due to important safety warning
  </Button>
  <p>TROLIGTVIS image</p>
  <Rule />
</Section>
<Section>
  <Title>Furniture and home inspiration</Title>
  <p>
    For more than 70 years, we have worked to create a better everyday life for
    the many people. As a home furnishing store, we do this by producing
    furniture that is well-designed, functional and affordable. Here you will
    find everything from
    <a href="/">smart home</a>
    solutions to a large selection of
    <a href="/">bedroom furniture</a>,
    <a href="/">lighting</a>,
    <a href="/">sofas</a>,
    <a href="/">homeware</a>,
    <a href="/">blinds</a>,
    <a href="/">curtains</a>,
    <a href="/">bedding</a>
    and more. Discover our wide range of products in-store or online!
  </p>
  <Rule />
</Section>
<Section>
  <Button tertiary>Back to top</Button>
</Section>
