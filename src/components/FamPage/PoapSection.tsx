import { captureException } from "@sentry/nextjs";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import type { ChangeEvent, CSSProperties, FC, FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { FixedSizeList } from "react-window";
import useSWR from "swr";
import { fetchJsonSwr } from "../../api/fetchers";
import closeSvg from "../../assets/close.svg";
import flexSvg from "../../assets/flex-own.svg";
import logoTwitterWhite from "../../assets/logo-twitter-white.svg";
import questionMarkSvg from "../../assets/question-mark-v2.svg";
import roundNerdLarge from "../../assets/round-nerd-large.svg";
import sobSvg from "../../assets/sob-own.svg";
import { getDomain } from "../../config";
import { formatDistance } from "../../format";
import withBasicErrorBoundary from "../../higher-order-components/WithBasicErrorBoundary";
import type { AuthFromSection } from "../../hooks/use-auth-from-section";
import useAuthFromSection from "../../hooks/use-auth-from-section";
import useFuseSearch from "../../hooks/use-fuse-search";
import { useTwitterAuthStatus } from "../../hooks/use-twitter-auth";
import scrollbarStyles from "../../styles/Scrollbar.module.scss";
import type { DateTimeString } from "../../time";
import Nerd from "../Nerd";
import {
  AlignmentText,
  LoadingText,
  NegativeText,
  PositiveText,
} from "../StatusText";
import { BaseText, TooltipTitle } from "../Texts";
import BodyTextV2 from "../TextsNext/BodyTextV2";
import LabelText from "../TextsNext/LabelText";
import QuantifyText from "../TextsNext/QuantifyText";
import { SectionTitle } from "../TextsNext/SectionTitle";
import SkeletonText from "../TextsNext/SkeletonText";
import Twemoji from "../Twemoji";
import TwitterStatusText from "../TwitterStatusText";
import WidgetErrorBoundary from "../WidgetErrorBoundary";
import { WidgetBackground } from "../WidgetSubcomponents";
import hearNoEvilSvg from "./hear-no-evil-own.svg";
import logoPoapSvg from "./logo-poap-slateus.svg";
import magnifyingGlassSvg from "./magnifying-glass-own.svg";
import seeNoEvilSvg from "./see-no-evil-own.svg";
import speakNoEvilSvg from "./speak-no-evil-own.svg";
import ultraSoundPoapStill from "./ultrasoundpoapstill.png";
import ultraSoundPoapGif from "./utlra_sound_poap.gif";
import StyledLink from "../StyledLink";

type Props = {
  className?: string;
  onClickClose?: () => void;
};

const TooltipText: FC<{ children: ReactNode }> = ({ children }) => (
  <BaseText font="font-inter" size="text-base" inline={false}>
    {children}
  </BaseText>
);

const ClaimPoapTooltip: FC<Props> = ({ className = "", onClickClose }) => (
  <div
    onClick={(e) => {
      e.stopPropagation();
    }}
    className={`
      relative
      flex flex-col gap-y-4
      rounded-lg border border-blue-shipcove
      bg-blue-tangaroa p-8
      text-left
      ${className}
    `}
  >
    <button
      className={`
        flex w-6
        select-none self-end
        hover:brightness-110 active:brightness-90
      `}
    >
      <Image
        alt="a close button, circular with an x in the middle"
        draggable={false}
        height={24}
        onClick={onClickClose}
        src={closeSvg as StaticImageData}
        width={24}
      />
    </button>
    <div className="flex select-none justify-center">
      <Image
        alt="the Proof of Attendance (POAP) logo"
        className="h-20 w-20 cursor-pointer select-none rounded-full"
        src={logoPoapSvg as StaticImageData}
        height={100}
        width={100}
      />
    </div>
    <TooltipTitle>ultra sound POAP</TooltipTitle>
    <div className="flex flex-col gap-y-4 overflow-y-scroll">
      <TooltipText>
        The ultra sound money meme spreads at L0, via humans.
      </TooltipText>
      <TooltipText>
        This exclusive POAP is a small reward for early meme spreaders.
      </TooltipText>
      <LabelText>eligibility</LabelText>
      <TooltipText>
        Only 1,559 pre-merge fam accounts are eligible, ranked by number of
        follows from other fam.
      </TooltipText>
      <LabelText>Fam</LabelText>
      <Twemoji wrapper imageClassName="inline-block align-middle h-4 ml-1">
        <TooltipText>
          The fam are{" "}
          <StyledLink
            className="text-slateus-200 hover:underline"
            href="https://twitter.com/i/lists/1376636817089396750"
          >
            5,000+ supporters
          </StyledLink>{" "}
          with variants of the bat signal{" "}
          <span className="whitespace-nowrap">🦇🔊</span> on their Twitter
          profile.
        </TooltipText>
      </Twemoji>
      <LabelText>benefits</LabelText>
      <TooltipText>
        Beyond pride and glory, POAP holders get priority access to the{" "}
        <StyledLink
          className="text-slateus-200 hover:underline"
          href="https://ultrasound.money/#discord"
        >
          ultra sound Discord.
        </StyledLink>
      </TooltipText>
    </div>
  </div>
);

const ClaimStatusText: FC<{ status: ClaimStatus }> = ({ status }) =>
  status === "invalid-address" ? (
    <NegativeText>invalid wallet id</NegativeText>
  ) : status === "error" ? (
    <NegativeText>error</NegativeText>
  ) : status === "sending" ? (
    <LoadingText>sending...</LoadingText>
  ) : status === "sent" ? (
    <PositiveText>sent!</PositiveText>
  ) : (
    <AlignmentText />
  );

type ClaimStatus = "sending" | "invalid-address" | "error" | "sent" | "init";

const ClaimPoap: FC<{ className?: string; refreshClaimStatus: () => void }> = ({
  className,
  refreshClaimStatus,
}) => {
  const [twitterAuthStatus, setTwitterAuthStatus] = useTwitterAuthStatus();
  const [, setAuthFromSection] = useAuthFromSection();
  const [walletId, setWalletId] = useState<string>("");
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("init");
  const [showTooltip, setShowTooltip] = useState(false);

  const handleWalletIdInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setWalletId(event.target.value);
    },
    [],
  );

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();

      const submit = async () => {
        if (twitterAuthStatus.type !== "authenticated") {
          throw new Error("tried to submit without twitter auth");
        }

        setClaimStatus("sending");

        const res = await fetch("/api/v2/fam/poap/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletId }),
        });

        if (res.status === 200) {
          setClaimStatus("sent");
          refreshClaimStatus();
          return;
        }

        if (res.status === 400) {
          setClaimStatus("invalid-address");
          return;
        }

        try {
          const body = (await res.json()) as { message?: string };
          if (typeof body.message === "string") {
            throw new Error(body.message);
          }

          console.error(body);
          throw new Error(
            `failed to claim poap, status ${res.status}, json body but no message`,
          );
        } catch (error) {
          console.log("tried to parse unknown as json body: ", error);
          throw new Error(
            `failed to claim poap, status ${res.status}, no json body`,
          );
        }
      };

      submit().catch((error) => {
        setClaimStatus("error");
        captureException(error);
        console.error(error);
      });
    },
    [refreshClaimStatus, twitterAuthStatus.type, walletId],
  );

  const handleSignOut = useCallback(() => {
    const signOut = async () => {
      const res = await fetch("/api/auth/twitter", {
        method: "DELETE",
      });

      if (res.status === 200) {
        setWalletId("");
        setClaimStatus("init");
        setTwitterAuthStatus({ type: "init" });
        return;
      }

      setTwitterAuthStatus({
        type: "error",
        message: "failed to sign out",
      });

      throw new Error("failed to sign out");
    };

    setTwitterAuthStatus({ type: "signing-out" });

    signOut().catch((error) => {
      captureException(error);
    });
  }, [setTwitterAuthStatus]);

  const handleClickNerd = useCallback(() => {
    setShowTooltip(true);
  }, []);

  const NotEligible = () => (
    <div className="flex flex-col gap-y-4">
      <LabelText className="truncate">status: not eligible</LabelText>
      <div className="select-none">
        <Image
          alt="a sobbing emoji signifying sadness at not being eligible"
          className="select-none self-center"
          height={30}
          src={sobSvg as StaticImageData}
          width={30}
        />
      </div>
    </div>
  );

  const Claimed: FC = () => (
    <div className="flex flex-col justify-center gap-y-4">
      <LabelText className="truncate">status: claimed</LabelText>
      <div className="select-none">
        <Image
          alt="a sobbing emoji signifying sadness at not being eligible"
          className="select-none self-center"
          height={30}
          src={flexSvg as StaticImageData}
          width={30}
        />
      </div>
    </div>
  );

  return (
    <>
      <WidgetBackground
        className={`flex max-w-3xl flex-col justify-between ${className}`}
      >
        <div className="relative flex items-start justify-between">
          <div className="flex items-center" onClick={handleClickNerd}>
            <LabelText>claim poap</LabelText>
            <Nerd />
          </div>
          <div
            className={`
              ${showTooltip ? "block" : "hidden"} fixed
              top-1/2 left-1/2 z-30 w-[20rem]
              -translate-x-1/2
              -translate-y-1/2
              cursor-auto
            `}
          >
            <ClaimPoapTooltip onClickClose={() => setShowTooltip(false)} />
          </div>
          <div className="-mr-1.5 select-none">
            <Image
              alt="the proof of attendance protocol (POAP) logo, a protocol issuing NFTs proving you attended some event or are part of some group"
              className="select-none"
              height={40}
              src={logoPoapSvg as StaticImageData}
              width={40}
            />
          </div>
        </div>
        <div className="flex flex-col gap-y-8">
          <div className="flex flex-col gap-y-4">
            <div className="flex items-baseline justify-between">
              <LabelText>your twitter</LabelText>
              <TwitterStatusText status={twitterAuthStatus} />
            </div>
            {twitterAuthStatus.type !== "authenticated" ? (
              <a
                href="/api/auth/twitter"
                className={`
                  flex select-none gap-x-2 self-center
                  rounded-full
                  border
                  border-slateus-200 bg-slateus-600 py-1.5
                  px-3 outline-slateus-200 hover:brightness-110
                  active:brightness-90
                  md:py-2
                  ${
                    twitterAuthStatus.type === "checking" ||
                    twitterAuthStatus.type === "authenticating"
                      ? "pointer-events-none opacity-50"
                      : "pointer-events-auto"
                  }
                `}
                onClick={() => {
                  setTwitterAuthStatus({ type: "authenticating" });
                  setAuthFromSection("poap");
                }}
              >
                <BodyTextV2>authenticate</BodyTextV2>
                <Image
                  alt="twitte logo in white"
                  src={logoTwitterWhite as StaticImageData}
                  height={16}
                  width={16}
                />
              </a>
            ) : (
              <button
                className={`
                  flex select-none items-center gap-x-2
                  self-center
                  rounded-full
                  border
                  border-slateus-200 bg-slateus-600 py-1.5
                  px-3 outline-slateus-200 hover:brightness-125
                  active:brightness-90
                  md:py-2
                `}
                onClick={handleSignOut}
              >
                <BodyTextV2>sign out @{twitterAuthStatus.handle}</BodyTextV2>
                <Image
                  alt="twitte logo in white"
                  src={logoTwitterWhite as StaticImageData}
                  height={16}
                  width={16}
                />
              </button>
            )}
          </div>
          {twitterAuthStatus.type === "authenticated" &&
          !twitterAuthStatus.eligibleForPoap ? (
            <NotEligible />
          ) : twitterAuthStatus.type === "authenticated" &&
            twitterAuthStatus.claimedPoap ? (
            <Claimed />
          ) : (
            <div
              className={`
                flex flex-col gap-y-4
                ${
                  twitterAuthStatus.type === "authenticated"
                    ? "opacity-100"
                    : "opacity-50"
                }
              `}
            >
              <div className="flex items-baseline justify-between gap-x-1">
                <LabelText>your wallet address</LabelText>
                <ClaimStatusText status={claimStatus} />
              </div>
              <form
                className={`
                  flex justify-center
                  rounded-full
                  border border-slateus-500 bg-slateus-800
                  valid:border-emerald-400
                  focus-within:border-slateus-400
                  focus-within:valid:border-emerald-400
                  [&_button]:invalid:opacity-50
                  ${
                    twitterAuthStatus.type === "authenticated"
                      ? "pointer-events-auto"
                      : "pointer-events-none"
                  }
                `}
                onSubmit={handleSubmit}
              >
                <input
                  className={`
                    w-full
                    rounded-full
                    bg-transparent
                    pl-4 font-inter text-xs font-light
                    text-white
                    placeholder-slateus-400
                    outline-none
                    md:text-base
                  `}
                  onChange={handleWalletIdInputChange}
                  pattern="0x[0-9a-fA-F]{40}|.+\.eth"
                  placeholder="vitalik.eth / 0xd4nk..."
                  required
                  spellCheck="false"
                  type="text"
                  value={walletId}
                />
                <button
                  className={`
                    group
                    relative my-px mr-px
                    flex
                    select-none rounded-full
                    bg-gradient-to-tr
                    from-cyan-400
                    to-indigo-600 px-4
                    py-[5px]
                    font-light
                    text-white
                    md:m-0.5
                    md:py-1.5
                  `}
                  type="submit"
                >
                  <BodyTextV2 className="z-10">submit</BodyTextV2>
                  <div
                    className={`
                      discord-submit
                      absolute left-[1px] right-[1px] top-[1px] bottom-[1px]
                      rounded-full bg-slateus-700
                      group-hover:hidden
                    `}
                  ></div>
                </button>
              </form>
            </div>
          )}
        </div>
      </WidgetBackground>
      <div
        className={`
          fixed top-0 left-0 bottom-0 right-0
          z-20 flex items-center
          justify-center
          bg-slateus-700/60
          backdrop-blur-sm
          ${showTooltip ? "" : "hidden"}
        `}
        onClick={() => setShowTooltip(false)}
      ></div>
    </>
  );
};

const monkeySvgs = [
  seeNoEvilSvg as StaticImageData,
  speakNoEvilSvg as StaticImageData,
  hearNoEvilSvg as StaticImageData,
];

const Claimed: FC<{
  claimedOn: DateTimeString | undefined;
  isLoading: boolean;
  monkey: StaticImageData;
}> = ({ claimedOn, isLoading, monkey }) => {
  const [age, setAge] = useState<string>();

  useEffect(() => {
    if (claimedOn === undefined) {
      return;
    }

    const now = new Date();

    // Set the current age immediately.
    setAge(formatDistance(now, new Date(claimedOn)));

    // And update it every 5 seconds.
    const intervalId = window.setInterval(() => {
      setAge(formatDistance(now, new Date(claimedOn)));
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [claimedOn]);

  return (
    <div className="flex items-baseline justify-end">
      <QuantifyText>
        <SkeletonText width="4rem">
          {isLoading || monkey === undefined ? undefined : age === undefined ? (
            <Image
              className="select-none"
              title="not claimed"
              alt="random emoji monkey covering one of its senses to indicate empathetic embarassment at not claiming a POAP"
              width={32}
              height={32}
              src={monkey}
            />
          ) : (
            <BodyTextV2>{age}</BodyTextV2>
          )}
        </SkeletonText>
      </QuantifyText>
      <BodyTextV2
        className={`ml-2 text-slateus-400 ${
          isLoading || age === undefined ? "hidden" : ""
        }`}
      >
        {" ago"}
      </BodyTextV2>
    </div>
  );
};

type EligibleFamClaimStatus = {
  claimed_on: DateTimeString | null;
  fam_follower_count: number;
  handle: string;
  name: string;
  profile_image_url: string;
  twitter_id: string;
};

const ImageWithFallback: FC<{ handle: string; src: string }> = ({
  handle,
  src,
}) => {
  const [imgSrc, setImgSrc] = useState<string | StaticImageData>(src);

  const onImageError = useCallback(() => {
    setImgSrc(questionMarkSvg as StaticImageData);
  }, []);

  return (
    <div className="relative mt-0.5 h-[40px] w-[40px] min-w-[40px]">
      <Image
        alt={`profile image of ${handle}`}
        className={`max-h-[40px] max-w-[40px] select-none rounded-full`}
        onError={onImageError}
        src={imgSrc}
        layout="fill"
        sizes="40px"
      />
    </div>
  );
};

const Row: FC<{
  data: EligibleFamClaimStatus[];
  index: number;
  style: CSSProperties;
  className?: string;
}> = ({ data, style = {}, index, className = "" }) => {
  const fam = data[index];

  return (
    <li
      style={style}
      className={`grid grid-cols-[1fr_72px] items-center gap-x-4 md:grid-cols-[1fr_72px] ${className}`}
      key={fam.twitter_id}
    >
      <a
        className="flex cursor-pointer items-center truncate hover:opacity-60 active:brightness-90"
        href={`https://twitter.com/${fam.handle}`}
        rel="noreferrer"
        target="_blank"
      >
        <ImageWithFallback handle={fam.handle} src={fam.profile_image_url} />
        <Twemoji imageClassName="inline-block align-middle h-4 ml-1">
          <div className="ml-4 flex h-full flex-col items-start truncate">
            <BodyTextV2 className="w-full truncate">{fam.name}</BodyTextV2>
            <BodyTextV2 className="truncate text-slateus-400">
              @{fam.handle}
            </BodyTextV2>
          </div>
        </Twemoji>
      </a>
      <Claimed
        isLoading={false}
        claimedOn={fam.claimed_on ?? undefined}
        monkey={monkeySvgs[index % 3]}
      />
    </li>
  );
};

const EligibleHandles: FC<{ className?: string }> = ({ className }) => {
  const { data } = useSWR<EligibleFamClaimStatus[], Error>(
    "/api/v2/fam/poap/eligible-fam",
    fetchJsonSwr,
  );
  const [searchHandle, setSearchHandle] = useState("");
  const searchResults = useFuseSearch(
    data,
    searchHandle,
    { keys: ["handle"] },
    { limit: 10 },
  );

  return (
    <WidgetBackground className={className}>
      <div className="mb-4 flex justify-between">
        <LabelText>1,559 Eligible Handles</LabelText>
        <LabelText className="text-right">claimed?</LabelText>
      </div>
      {data === undefined ? (
        <div className="flex h-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <ul className={`-mr-2 flex flex-col overflow-y-auto pr-1`}>
          {searchResults === undefined || searchResults.length === 0 ? (
            <FixedSizeList
              height={358}
              itemCount={data.length}
              itemSize={64}
              width="100%"
              itemData={data}
              className={scrollbarStyles["styled-scrollbar"]}
            >
              {Row}
            </FixedSizeList>
          ) : (
            <div className="h-[358px]">
              {searchResults.map((result) => (
                <Row
                  key={result.refIndex}
                  data={data}
                  index={result.refIndex}
                  className="h-16"
                  // FixedSizeList does not accept a component with optional
                  // style, so it is required, but we don't need one here so
                  // pass an empty one.
                  style={{}}
                />
              ))}
            </div>
          )}
        </ul>
      )}
      <div className="relative mt-8">
        <input
          className={`
            w-full
            rounded-full
            border border-slateus-500
            bg-slateus-800 py-1.5 pl-4
            font-inter text-xs font-light
            text-white placeholder-slateus-400 outline-none
            focus-within:border-slateus-400
            md:py-2
            md:text-base
          `}
          onChange={(event) => setSearchHandle(event.target.value)}
          placeholder="search..."
          type="text"
          value={searchHandle}
        />
        <div className="absolute top-1.5 right-3 select-none md:top-3">
          <Image
            alt="magnifying glass indicating this input is to search for handles"
            src={magnifyingGlassSvg as StaticImageData}
            width={16}
            height={16}
          />
        </div>
      </div>
    </WidgetBackground>
  );
};

const Spinner = () => (
  <div className="h-20 w-20 animate-spin rounded-[50%] [border:8px_solid_#2d344a] [border-top:8px_solid_#8991ad]"></div>
);

type RecentClaimAccount = {
  bio: string;
  claimed_on: DateTimeString;
  fam_follower_count: number;
  follower_count: number;
  handle: string;
  linkables: Linkables | null;
  name: string;
  profile_image_url: string | null;
  twitter_id: string;
};

type PoapsClaimed = {
  count: number;
  index: number;
  latest_claimers: RecentClaimAccount[];
};

const Claimer: FC<{ handle: string; src: string | null; index: number }> = ({
  handle,
  index,
  src,
}) => {
  const [imgSrc, setImgSrc] = useState<string | StaticImageData | null>(src);

  const onImageError = useCallback(() => {
    setImgSrc(questionMarkSvg as StaticImageData);
  }, []);

  return (
    <div
      className={`
        relative mt-0.5 ${index !== 0 ? "-ml-2" : ""}
        h-[40px] w-[40px] min-w-[40px]
        rounded-full
        border border-slateus-200
      `}
    >
      <Image
        alt={`profile image of ${handle}`}
        className={"max-h-[40px] max-w-[40px] select-none rounded-full"}
        onError={onImageError}
        src={imgSrc === null ? (questionMarkSvg as StaticImageData) : imgSrc}
        layout="fill"
        sizes="40px"
      />
    </div>
  );
};

const PoapSection: FC = () => {
  const { data: poapsClaimed, mutate } = useSWR<PoapsClaimed, Error>(
    `${getDomain()}/api/v2/fam/poap/claimed`,
    fetchJsonSwr,
  );
  const { ref, inView } = useInView({ threshold: 1 });
  const [poapSrc, setPoapSrc] = useState(ultraSoundPoapGif);

  useEffect(() => {
    if (inView) {
      const timeoutId = window.setTimeout(() => {
        setPoapSrc(ultraSoundPoapStill);
      }, 3000);

      return () => window.clearTimeout(timeoutId);
    }
  }, [inView]);

  const id: AuthFromSection = "poap";

  const handleRefreshClaimStatus = useCallback(() => {
    mutate().catch(captureException);
  }, [mutate]);

  return (
    <section className="px-4 md:px-16" id={id}>
      <SectionTitle className="mt-16 pt-16" link="poap" subtitle="only 1,559">
        ultra sound POAP
      </SectionTitle>
      <div className="my-12 flex justify-center">
        <div
          className="flex cursor-pointer select-none"
          ref={ref}
          onClick={() => {
            setPoapSrc(ultraSoundPoapGif);
            window.setTimeout(() => {
              setPoapSrc(ultraSoundPoapStill);
            }, 5000);
          }}
        >
          <Image
            className="select-none"
            alt="image from the ultra sound money poap given out to pre-merge fam"
            src={poapSrc}
            width={144}
            height={144}
          />
        </div>
      </div>
      <div className="grid auto-rows-min gap-4 lg:grid-cols-2">
        <WidgetBackground className="flex flex-col gap-y-8 overflow-hidden">
          <div className="flex flex-col gap-y-4">
            <LabelText>claims</LabelText>
            <QuantifyText className="text-3xl">
              <SkeletonText width="4rem">{poapsClaimed?.count}</SkeletonText>
              <span className="text-slateus-200">/1,559</span>
            </QuantifyText>
          </div>
          <div className="flex w-full overflow-x-scroll">
            {poapsClaimed?.latest_claimers
              .slice(0, 17)
              .map((claimer, index) => (
                <Claimer
                  key={claimer.twitter_id}
                  handle={claimer.handle}
                  src={claimer.profile_image_url}
                  index={index}
                />
              ))}
          </div>
        </WidgetBackground>
        <WidgetErrorBoundary title="claim POAP">
          <ClaimPoap
            className="col-start-1"
            refreshClaimStatus={handleRefreshClaimStatus}
          />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary title="1,559 Eligible Handles">
          <EligibleHandles className="row-span-2 lg:col-start-2 lg:row-start-1" />
        </WidgetErrorBoundary>
      </div>
    </section>
  );
};

export default withBasicErrorBoundary(PoapSection);
