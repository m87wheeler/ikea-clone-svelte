<script>
  import Notification from "../../svg/Notification.svelte";
  import ToggleArrow from "../../svg/ToggleArrow.svelte";
  import Button from "../atoms/Button.svelte";
  import FooterIcon from "../atoms/FooterIcon.svelte";
  import Link from "../atoms/Link.svelte";
  import Rule from "../atoms/Rule.svelte";
  import Section from "../atoms/Section.svelte";
  import Title from "../atoms/Title.svelte";
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  footer {
    margin-top: 3rem;
    padding-bottom: 1.5rem;
    background: $color-gray-100;

    p {
      @include common-text;
    }
  }

  .join-family {
    display: grid;
    grid-template-rows: repeat(3, auto);
    justify-items: flex-start;
    row-gap: 1rem;
  }

  .link-grid {
    display: grid;
    column-gap: 0.5rem;
    align-items: center;
    justify-content: flex-start;
    font-weight: 700;

    &--rtl {
      grid-template-columns: 1fr 1.5rem;
    }
  }

  .language {
    .icon {
      display: grid;
      grid-template-columns: auto 1fr;
      column-gap: 0.25rem;
      align-items: center;
      font-weight: 600;
      color: #fff;
      filter: invert(1) contrast(0.5);
    }
  }

  .footer-links {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
  }
</style>

<footer>
  <Section>
    <div class="join-family">
      <Title type="h3" style="font-size: 1.375rem; color: #111;">
        Join IKEA Family
      </Title>
      <p>
        Get exclusive offers, inspiration, and lots more to help bring your
        ideas to life. All for free.
        <Link inline>See more.</Link>
      </p>
      <Button secondary>Join or log in</Button>
    </div>
  </Section>
  <Section>
    <Rule />
    <div class="other-links">
      <p class="link-grid link-grid--rtl">
        Services
        <ToggleArrow style="filter: invert(1); transform: rotate(-90deg);" />
      </p>
      <Rule />
      <p class="link-grid link-grid--rtl">
        Help
        <ToggleArrow style="filter: invert(1); transform: rotate(-90deg);" />
      </p>
      <Rule />
      <p class="link-grid link-grid--rtl">
        About IKEA
        <ToggleArrow style="filter: invert(1); transform: rotate(-90deg);" />
      </p>
      <Rule />
      <p class="link-grid link-grid--rtl">
        IKEA Family
        <ToggleArrow style="filter: invert(1); transform: rotate(-90deg);" />
      </p>
      <Rule />
    </div>
  </Section>
  <Section>
    <div class="social-links">
      <FooterIcon round icon="facebook" />
      <FooterIcon round icon="twitter" />
      <FooterIcon round icon="pinterest" />
      <FooterIcon round icon="instagram" />
      <FooterIcon round icon="youtube" />
    </div>
  </Section>
  <Section>
    <div class="payment-links">
      <FooterIcon square icon="visa" />
      <FooterIcon square icon="mastercard" />
      <FooterIcon square icon="amex" />
      <FooterIcon square icon="maestro" />
      <FooterIcon square icon="paypal" />
      <FooterIcon square icon="ppcredit" />
      <FooterIcon square icon="giftcard" />
    </div>
  </Section>
  <Section>
    <div class="language">
      <Button>
        <span class="icon">
          <Notification />
          Change country
        </span>
      </Button>
    </div>
  </Section>
  <Section>
    <p style="font-size: .75rem;">
      IKEA United Kingdom - 7th Floor, 100 Avebury Boulevard, Milton Keynes, MK9
      1FH © Inter IKEA Systems B.V 1999-2020
    </p>
  </Section>
  <Section>
    <div class="footer-links">
      <Link inline style="text-decoration: none;">Privacy policy</Link>
      <Link inline style="text-decoration: none;">Cookie policy</Link>
      <Link inline style="text-decoration: none;">Cookie settings</Link>
      <Link inline style="text-decoration: none;">Terms & conditions</Link>
      <Link inline style="text-decoration: none;">
        Responsible Disclosure policy
      </Link>
      <Link inline style="text-decoration: none;">
        Modern Slavery Statement
      </Link>
      <Link inline style="text-decoration: none;">Accessibility</Link>
    </div>
  </Section>
</footer>
