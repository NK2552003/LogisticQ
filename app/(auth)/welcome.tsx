import { router } from "expo-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react-native";
import { useRef, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import Header from "../components/Header";
import { landingPageSections } from "../consts/constants";

const Welcome = () => {
  const SwiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    if (activeIndex === landingPageSections.length - 1) {
      router.replace("/(auth)/main");
    } else {
      SwiperRef.current?.scrollBy(1);
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      SwiperRef.current?.scrollBy(-1);
    }
  };

  return (
    <SafeAreaView className="flex h-full items-center bg-[#f9fafb]">
      {/* <Image source={require('../Utils/Pictures/background.png')} className="relative top-0 left-0 w-full h-full -z-100 opacity-5" /> */}
       <Header />
        {/* Swiper */}
        <Swiper
          ref={SwiperRef}
          loop={false}
          showsPagination={false}
          onIndexChanged={(index) => {
            setActiveIndex(index);
          }}
        >
          {landingPageSections.map((section, index) => (
            <View
              key={index}
              className="flex-1 justify-center items-center z-0"
            >
              {section.type === "svg" ? (
                <section.image width={"100%"} height={250} />
              ) : (
                <Image
                  source={section.image}
                  className="w-[100%] h-[350px] items-center justify-center"
                  resizeMode="contain"
                />
              )}
              {/* Left-aligned text container */}
              <View className="px-4 w-full relative items-start justify-end top-[80px]">
                <Text className="text-4xl font-bold text-left pb-4">
                  {section.title}
                </Text>
                <Text className="text-lg mt-2 text-left">
                  {section.description}
                </Text>
              </View>
            </View>
          ))}
        </Swiper>

        {/* Bottom row: dots + buttons */}
        <View className="absolute bottom-8 w-full px-4 flex-row justify-between items-center">
          {/* Pagination dots - simplified without complex animations */}
          <View className="flex-row gap-1 px-2 items-center">
            {landingPageSections.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "w-6 bg-[#F59E42] opacity-100" // darker orange for active
                    : "w-2 bg-[#D97706] opacity-40" // deep amber for inactive
                }`}
              />
            ))}
          </View>

          {/* Buttons container */}
          <View className="flex-row gap-2 items-center">
            {/* Back button */}
            {activeIndex > 0 ? (
              <TouchableOpacity
                className="border border-[#f4b26b] p-3 rounded-2xl active:bg-[#FDE68A]"
                onPress={handleBack}
              >
                <ArrowLeft color="#f4b26b" size={24} />
              </TouchableOpacity>
            ) : (
              <View className="w-12" />
            )}

            {/* Next / Get Started button */}
            <TouchableOpacity
              className="border border-[#F59E42] p-3 rounded-2xl active:bg-[#FDE68A]"
              onPress={handleNext}
            >
              {activeIndex === landingPageSections.length - 1 ? (
                <Check color="#D97706" size={24} />
              ) : (
                <ArrowRight color="#D97706" size={24} />
              )}
            </TouchableOpacity>
          </View>
        </View>
    </SafeAreaView>
  );
};

export default Welcome;
