#import "ReservedRegionsView.h"

#import <objc/message.h>

#import <react/renderer/components/ReservedRegionsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/ReservedRegionsViewSpec/EventEmitters.h>
#import <react/renderer/components/ReservedRegionsViewSpec/Props.h>
#import <react/renderer/components/ReservedRegionsViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation ReservedRegionsView {
  NSArray<NSDictionary *> *_currentRegions;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ReservedRegionsViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ReservedRegionsViewProps>();
    _props = defaultProps;
  }
  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self updateRegions];
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self updateRegions];
}

- (void)updateRegions
{
  if (self.window == nil || !_eventEmitter) {
    return;
  }

  // UIView reserved region selectors first ship in the iOS 27.1 SDK.
  SEL querySelector = NSSelectorFromString(@"reservedRegionsOfKind:options:");
  Class kindClass = NSClassFromString(@"UIViewReservedRegionKind");
  NSMutableArray<NSDictionary *> *regions = [NSMutableArray new];

  if ([self respondsToSelector:querySelector] && kindClass != nil) {
    NSArray<NSDictionary<NSString *, NSString *> *> *kinds = @[
      @{@"selector": @"divisionRegionKind", @"kind": @"division"},
      @{@"selector": @"occlusionRegionKind", @"kind": @"occlusion"},
    ];

    for (NSDictionary<NSString *, NSString *> *entry in kinds) {
      SEL kindSelector = NSSelectorFromString(entry[@"selector"]);
      if (![kindClass respondsToSelector:kindSelector]) {
        continue;
      }

      id kind = ((id (*)(id, SEL))objc_msgSend)(kindClass, kindSelector);
      NSArray *results = ((NSArray *(*)(id, SEL, id, NSUInteger))objc_msgSend)(self, querySelector, kind, 0);
      for (id region in results) {
        if (![region respondsToSelector:@selector(frame)]) {
          continue;
        }
        CGRect frame = [[region valueForKey:@"frame"] CGRectValue];
        [regions addObject:@{
          @"kind": entry[@"kind"],
          @"frame": [NSValue valueWithCGRect:frame],
        }];
      }
    }
  }

  if ([_currentRegions isEqualToArray:regions]) {
    return;
  }
  _currentRegions = [regions copy];

  ReservedRegionsViewEventEmitter::OnRegionsChange event;
  for (NSDictionary *region in regions) {
    CGRect frame = [region[@"frame"] CGRectValue];
    event.regions.push_back({
        [region[@"kind"] UTF8String],
        {frame.origin.x, frame.origin.y, frame.size.width, frame.size.height},
        false,
    });
  }
  std::static_pointer_cast<ReservedRegionsViewEventEmitter const>(_eventEmitter)->onRegionsChange(event);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _currentRegions = nil;
}

@end
